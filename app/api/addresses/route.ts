import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  if (!(await requireApiAuth())) return NextResponse.json({error:"Unauthorized"},{status:401});
  const { rows } = await query("SELECT * FROM addresses ORDER BY is_default DESC, name ASC");
  return NextResponse.json({addresses: rows});
}

export async function POST(request: Request) {
  if (!(await requireApiAuth())) return NextResponse.json({error:"Unauthorized"},{status:401});
  const b = await request.json();

  if (b.is_default) await query("UPDATE addresses SET is_default=false");
  const { rows } = await query(
    `INSERT INTO addresses(name,street,city,state,zip,phone,is_default)
     VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [b.name,b.street,b.city,b.state,b.zip,b.phone ?? "",!!b.is_default],
  );
  return NextResponse.json({address: rows[0]});
}

export async function DELETE(request: Request) {
  if (!(await requireApiAuth())) return NextResponse.json({error:"Unauthorized"},{status:401});
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({error:"Missing id"},{status:400});
  await query("DELETE FROM addresses WHERE id=$1",[id]);
  return NextResponse.json({ok:true});
}
