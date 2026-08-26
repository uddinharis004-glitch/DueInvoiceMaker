import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { query, transaction } from "@/lib/db";
import { getCompany, nextInvoiceNumber } from "@/lib/invoice";
import { calculateInvoice } from "@/lib/calculations";

export const runtime = "nodejs";

export async function POST(request:Request){
  if(!(await requireApiAuth()))return NextResponse.json({error:"Unauthorized"},{status:401});
  const b=await request.json();
  if(!b.customerId||!b.addressId||!Array.isArray(b.lines)||!b.lines.length)return NextResponse.json({error:"Customer, address and at least one item are required."},{status:400});

  const company=await getCompany();
  const [customerResult,addressResult]=await Promise.all([
    query("SELECT * FROM customers WHERE id=$1",[b.customerId]),
    query("SELECT * FROM addresses WHERE id=$1",[b.addressId])
  ]);
  const customer=customerResult.rows[0]; const address=addressResult.rows[0];
  if(!customer||!address)return NextResponse.json({error:"Customer or address not found."},{status:400});

  const taxEnabled=!!b.taxEnabled;
  const taxRate=Math.max(0,Number(b.taxRate??0));
  const calc=calculateInvoice(b.lines,taxEnabled,taxRate);
  const paymentMade=Math.max(0,Math.min(calc.total,Number(b.paymentMade??0)));
  const balanceDue=Math.max(0,Math.round((calc.total-paymentMade+Number.EPSILON)*100)/100);
  const status=paymentMade>=calc.total && calc.total>0 ? "PAID" : paymentMade>0 ? "PARTIAL" : "UNPAID";

  const invoice=await transaction(async(client)=>{
    const invoiceNumber=await nextInvoiceNumber(company.invoice_prefix,client);
    const snapshotCompany={...company, logo_data:company.logo_data ?? null};
    const {rows}=await client.query(
      `INSERT INTO invoices(invoice_number,invoice_date,due_date,terms,customer_snapshot,company_snapshot,address_snapshot,items,subtotal,discount,tax,tax_rate,tax_enabled,total,payment_made,balance_due,payment_status,payment_method,payment_date,notes)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       RETURNING *`,
      [
        invoiceNumber,b.invoiceDate||new Date().toISOString().slice(0,10),b.dueDate||null,String(b.terms??""),
        JSON.stringify(customer),JSON.stringify(snapshotCompany),JSON.stringify(address),JSON.stringify(calc.lines),
        calc.subtotal,calc.discount,calc.tax,taxRate,taxEnabled,calc.total,paymentMade,balanceDue,status,String(b.paymentMethod??""),b.paymentDate||null,String(b.notes??"")
      ]
    );
    return rows[0];
  });

  return NextResponse.json({invoice});
}

export async function GET(request:Request){
  if(!(await requireApiAuth()))return NextResponse.json({error:"Unauthorized"},{status:401});
  const id=new URL(request.url).searchParams.get("id");
  if(id){
    const {rows}=await query("SELECT * FROM invoices WHERE id=$1",[id]);
    return rows[0]?NextResponse.json({invoice:rows[0]}):NextResponse.json({error:"Not found"},{status:404});
  }
  const {rows}=await query("SELECT * FROM invoices ORDER BY created_at DESC");
  return NextResponse.json({invoices:rows});
}
