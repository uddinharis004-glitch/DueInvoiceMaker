import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  if (!(await requireApiAuth())) return NextResponse.json({error:"Unauthorized"},{status:401});
  const { rows } = await query("SELECT * FROM tax_rates ORDER BY zip");
  return NextResponse.json({taxRates: rows});
}

export async function POST(request: Request) {
  if (!(await requireApiAuth())) return NextResponse.json({error:"Unauthorized"},{status:401});
  const b = await request.json();
  const { rows } = await query(
    `INSERT INTO tax_rates(zip,rate,label) VALUES($1,$2,$3)
     ON CONFLICT(zip) DO UPDATE SET rate=EXCLUDED.rate,label=EXCLUDED.label,updated_at=NOW()
     RETURNING *`,
    [String(b.zip).trim(), Number(b.rate ?? 0), String(b.label ?? "")],
  );
  return NextResponse.json({taxRate: rows[0]});
}

export async function DELETE(request: Request) {
  if (!(await requireApiAuth())) return NextResponse.json({error:"Unauthorized"},{status:401});
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({error:"Missing id"},{status:400});
  await query("DELETE FROM tax_rates WHERE id=$1",[id]);
  return NextResponse.json({ok:true});
}
