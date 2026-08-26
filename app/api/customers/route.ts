import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  if (!(await requireApiAuth())) return NextResponse.json({error:"Unauthorized"},{status:401});
  const {rows}=await query("SELECT * FROM customers ORDER BY name ASC");
  return NextResponse.json({customers:rows});
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
