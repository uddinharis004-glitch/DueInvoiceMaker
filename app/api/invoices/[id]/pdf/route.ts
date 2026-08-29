import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { getInvoice } from "@/lib/invoice";
import { renderPdf } from "@/lib/pdf";
import { invoiceHtml } from "@/lib/pdf-template";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  if(!(await requireApiAuth()))return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id}=await params;
  const invoice:any=await getInvoice(id);
  if(!invoice)return NextResponse.json({error:"Invoice not found"},{status:404});
  try {
    const html=invoiceHtml(invoice);
    const pdf=await renderPdf(html);
    return new NextResponse(new Uint8Array(pdf),{
      status:200,
      headers:{
        "Content-Type":"application/pdf",
        "Content-Disposition":`attachment; filename="${invoice.invoice_number}.pdf"`,
        "Cache-Control":"no-store"
      }
    });
  } catch(error) {
    console.error("PDF generation failed", error);
    return NextResponse.json({error:"PDF generation failed. Check the Vercel function log for details."},{status:500});
  }
}
