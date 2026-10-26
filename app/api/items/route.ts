import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { query } from "@/lib/db";
import { getPagination } from "@/lib/pagination";

export async function GET(request: Request) {
  if (!(await requireApiAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const { page, pageSize, offset } = getPagination(url.searchParams);
  const search = url.searchParams.get("q")?.trim() ?? "";
  const searchPattern = `%${search}%`;
  const where = search ? "WHERE name ILIKE $1 OR description ILIKE $1 OR sku ILIKE $1" : "";
  const values = search ? [searchPattern] : [];
  const limitPosition = values.length + 1;
  const offsetPosition = values.length + 2;

  const [itemsResult, countResult] = await Promise.all([
    query(
      `SELECT * FROM items ${where}
       ORDER BY created_at DESC, name ASC
       LIMIT $${limitPosition} OFFSET $${offsetPosition}`,
      [...values, pageSize, offset],
    ),
    query<{ total: string }>(`SELECT COUNT(*)::text AS total FROM items ${where}`, values),
  ]);
  const total = Number(countResult.rows[0]?.total ?? 0);

  return NextResponse.json({
    items: itemsResult.rows,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  });
}
export async function POST(request:Request){
  if(!(await requireApiAuth()))return NextResponse.json({error:"Unauthorized"},{status:401});const b=await request.json();
  const{rows}=await query(`INSERT INTO items(name,description,default_price,sku,taxable) VALUES($1,$2,$3,$4,$5) RETURNING *`,[b.name,b.description??"",Number(b.default_price??0),b.sku??"",b.taxable!==false]);
  return NextResponse.json({item:rows[0]});
}
export async function PUT(request:Request){
  if(!(await requireApiAuth()))return NextResponse.json({error:"Unauthorized"},{status:401});const id=new URL(request.url).searchParams.get("id");if(!id)return NextResponse.json({error:"Missing id"},{status:400});const b=await request.json();
  const{rows}=await query(`UPDATE items SET name=$1,description=$2,default_price=$3,sku=$4,taxable=$5,updated_at=NOW() WHERE id=$6 RETURNING *`,[b.name,b.description??"",Number(b.default_price??0),b.sku??"",b.taxable!==false,id]);
  return NextResponse.json({item:rows[0]});
}
export async function DELETE(request:Request){if(!(await requireApiAuth()))return NextResponse.json({error:"Unauthorized"},{status:401});const id=new URL(request.url).searchParams.get("id");if(!id)return NextResponse.json({error:"Missing id"},{status:400});await query("DELETE FROM items WHERE id=$1",[id]);return NextResponse.json({ok:true});}
