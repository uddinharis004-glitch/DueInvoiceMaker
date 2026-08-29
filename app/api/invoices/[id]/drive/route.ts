import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { getInvoice } from "@/lib/invoice";
import { renderPdf } from "@/lib/pdf";
import { invoiceHtml } from "@/lib/pdf-template";
import { uploadPdfToDrive } from "@/lib/drive";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(_request:Request,{params}:{params:Promise<{id:string}>}){
  if(!(await requireApiAuth()))return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id}=await params;
  const invoice:any=await getInvoice(id);
  if(!invoice)return NextResponse.json({error:"Invoice not found"},{status:404});

  try {
    const pdf=await renderPdf(invoiceHtml(invoice));
    const fileName=`${invoice.invoice_number} - ${invoice.customer_snapshot?.name ?? "Invoice"}.pdf`;
    const file=await uploadPdfToDrive(pdf,fileName);

    await query("UPDATE invoices SET drive_file_id=$1,drive_file_name=$2,updated_at=NOW() WHERE id=$3",[file.id,file.name,id]);

    return NextResponse.json({file});
  } catch(error) {
    console.error("PDF archive failed", error);
    return NextResponse.json({error:"PDF or Google Drive archive failed. Check the Vercel function log for details."},{status:500});
  }
}
