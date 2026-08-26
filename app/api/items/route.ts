import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(){if(!(await requireApiAuth()))return NextResponse.json({error:"Unauthorized"},{status:401});const{rows}=await query("SELECT * FROM items ORDER BY name ASC");return NextResponse.json({items:rows});}
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
