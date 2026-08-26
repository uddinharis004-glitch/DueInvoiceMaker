import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  if (!(await requireApiAuth())) return NextResponse.json({error:"Unauthorized"},{status:401});
  const { rows } = await query("SELECT * FROM company WHERE id=1");
  return NextResponse.json({ company: rows[0] });
}

export async function PUT(request: Request) {
  if (!(await requireApiAuth())) return NextResponse.json({error:"Unauthorized"},{status:401});
  const b = await request.json();

  const { rows } = await query(
    `UPDATE company SET
      name=$1, phone=$2, email=$3, website=$4, default_tax_enabled=$5,
      default_tax_rate=$6, default_terms=$7, invoice_prefix=$8,
      next_invoice_number=$9, updated_at=NOW()
     WHERE id=1 RETURNING *`,
    [
      String(b.name ?? ""), String(b.phone ?? ""), String(b.email ?? ""), String(b.website ?? ""),
      !!b.default_tax_enabled, Number(b.default_tax_rate ?? 0), String(b.default_terms ?? ""),
      String(b.invoice_prefix ?? "INV-"), Math.max(1, Number(b.next_invoice_number ?? 1)),
    ],
  );
  return NextResponse.json({ company: rows[0] });
}
