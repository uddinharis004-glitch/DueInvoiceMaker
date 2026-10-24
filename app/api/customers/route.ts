import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { query } from "@/lib/db";
import { getPagination } from "@/lib/pagination";

export async function GET(request: Request) {
  if (!(await requireApiAuth())) return NextResponse.json({error:"Unauthorized"},{status:401});
  const url = new URL(request.url);
  const { page, pageSize, offset } = getPagination(url.searchParams);
  const search = url.searchParams.get("q")?.trim() ?? "";
  const searchPattern = `%${search}%`;
  const where = search
    ? "WHERE name ILIKE $1 OR company_name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1"
    : "";
  const values = search ? [searchPattern] : [];
  const limitPosition = values.length + 1;
  const offsetPosition = values.length + 2;

  const [customersResult, countResult] = await Promise.all([
    query(
      `SELECT * FROM customers ${where}
       ORDER BY created_at DESC, name ASC
       LIMIT $${limitPosition} OFFSET $${offsetPosition}`,
      [...values, pageSize, offset],
    ),
    query<{ total: string }>(`SELECT COUNT(*)::text AS total FROM customers ${where}`, values),
  ]);
  const total = Number(countResult.rows[0]?.total ?? 0);

  return NextResponse.json({
    customers: customersResult.rows,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  });
}
export async function POST(request:Request){
  if (!(await requireApiAuth())) return NextResponse.json({error:"Unauthorized"},{status:401});
  const b=await request.json();
  const {rows}=await query(
    `INSERT INTO customers(name,company_name,street,city,state,zip,phone,email,notes)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [b.name,b.company_name??"",b.street??"",b.city??"",b.state??"",b.zip??"",b.phone??"",b.email??"",b.notes??""]
  );
  return NextResponse.json({customer:rows[0]});
}
export async function PUT(request:Request){
  if (!(await requireApiAuth())) return NextResponse.json({error:"Unauthorized"},{status:401});
  const id=new URL(request.url).searchParams.get("id"); if(!id)return NextResponse.json({error:"Missing id"},{status:400});
  const b=await request.json();
  const {rows}=await query(
    `UPDATE customers SET name=$1,company_name=$2,street=$3,city=$4,state=$5,zip=$6,phone=$7,email=$8,notes=$9,updated_at=NOW()
     WHERE id=$10 RETURNING *`,
    [b.name,b.company_name??"",b.street??"",b.city??"",b.state??"",b.zip??"",b.phone??"",b.email??"",b.notes??"",id]
  );
  return NextResponse.json({customer:rows[0]});
}
export async function DELETE(request:Request){
  if (!(await requireApiAuth())) return NextResponse.json({error:"Unauthorized"},{status:401});
  const id=new URL(request.url).searchParams.get("id"); if(!id)return NextResponse.json({error:"Missing id"},{status:400});
  await query("DELETE FROM customers WHERE id=$1",[id]); return NextResponse.json({ok:true});
}
