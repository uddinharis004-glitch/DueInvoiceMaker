"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import InvoicePreview from "@/components/InvoicePreview";
import { money } from "@/lib/utils";

export default function InvoiceDetails({id}:{id:string}){
  const [invoice,setInvoice]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{fetch(`/api/invoices?id=${id}`).then(r=>r.json()).then(d=>{setInvoice(d.invoice);setLoading(false)})},[id]);
  if(loading)return <div className="card">Loading invoice...</div>;
  if(!invoice)return <div className="card">Invoice not found.</div>;

  return <>
    <div className="toolbar" style={{justifyContent:"space-between"}}>
      <div><h1 className="page-title">{invoice.invoice_number}</h1><p className="muted">{invoice.customer_snapshot?.name} · {money(invoice.total)}</p></div>
      <div className="actions"><Link className="btn" href="/invoices">Back</Link><Link className="btn" href={`/invoices/print?id=${invoice.id}`} target="_blank">Print</Link><a className="btn primary" href={`/api/invoices/${invoice.id}/pdf`}>Download PDF</a><button className="btn" onClick={async()=>{const r=await fetch(`/api/invoices/${invoice.id}/drive`,{method:"POST"});if(r.ok){const d=await r.json();alert(`Saved to Google Drive: ${d.file?.name??"PDF"}`);const x=await fetch(`/api/invoices?id=${invoice.id}`);const y=await x.json();setInvoice(y.invoice);}else alert("Google Drive upload failed.");}}>Save to Drive</button></div>
    </div>
    <div className="preview-wrap"><InvoicePreview
      company={invoice.company_snapshot}
      address={invoice.address_snapshot}
      customer={invoice.customer_snapshot}
      invoiceNumber={invoice.invoice_number}
      invoiceDate={invoice.invoice_date}
      dueDate={invoice.due_date}
      terms={invoice.terms}
      lines={invoice.items}
      subtotal={Number(invoice.subtotal)}
      discount={Number(invoice.discount)}
      tax={Number(invoice.tax)}
      total={Number(invoice.total)}
      paymentMade={Number(invoice.payment_made)}
      balanceDue={Number(invoice.balance_due)}
      taxEnabled={invoice.tax_enabled}
    /></div>
  </>;
}
