"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { money } from "@/lib/utils";
import Toast from "@/components/Toast";

export default function InvoicesClient({initial}:{initial:any[]}){
  const [invoices,setInvoices]=useState(initial);
  const [q,setQ]=useState("");
  const [status,setStatus]=useState("ALL");
  const [deleting,setDeleting]=useState<string|null>(null);
  const [message,setMessage]=useState("");
  const filtered=useMemo(()=>invoices.filter(i=>{
    const text=`${i.invoice_number} ${i.customer_snapshot?.name??""} ${i.customer_snapshot?.company_name??""}`.toLowerCase();
    return text.includes(q.toLowerCase()) && (status==="ALL" || i.payment_status===status);
  }),[invoices,q,status]);

  async function remove(invoice:any){
    if(!confirm(`Delete invoice ${invoice.invoice_number}? This cannot be undone.`))return;
    setDeleting(invoice.id);
    const response=await fetch(`/api/invoices?id=${encodeURIComponent(invoice.id)}`,{method:"DELETE"});
    setDeleting(null);
    if(!response.ok){
      const data=await response.json().catch(()=>({}));
      alert(data.error??"Invoice could not be deleted.");
      return;
    }
    setInvoices(current=>current.filter(item=>item.id!==invoice.id));
    setMessage(`Invoice ${invoice.invoice_number} deleted successfully.`);
  }

  return <>
    {message&&<Toast message={message} onDismiss={()=>setMessage("")}/>}
    <div className="toolbar" style={{justifyContent:"space-between"}}><div><h1 className="page-title">Invoices</h1><p className="muted">Saved historical invoices and PDFs.</p></div><Link className="btn primary" href="/invoices/new">+ New Invoice</Link></div>
    <div className="card">
      <div className="toolbar"><input className="input" style={{maxWidth:420}} placeholder="Search invoice/customer..." value={q} onChange={e=>setQ(e.target.value)}/><select className="select" style={{maxWidth:180}} value={status} onChange={e=>setStatus(e.target.value)}><option>ALL</option><option>PAID</option><option>UNPAID</option><option>PARTIAL</option><option>OVERDUE</option></select></div>
      <div className="table-wrap"><table><thead><tr><th>Invoice</th><th>Customer</th><th>Date</th><th>Total</th><th>Balance</th><th>Status</th><th></th></tr></thead><tbody>
        {filtered.map(i=><tr key={i.id}><td><Link href={`/invoices/view?id=${i.id}`}><strong>{i.invoice_number}</strong></Link></td><td>{i.customer_snapshot?.name}</td><td>{new Date(i.invoice_date).toLocaleDateString()}</td><td>{money(i.total)}</td><td>{money(i.balance_due)}</td><td><span className={`badge ${String(i.payment_status).toLowerCase()}`}>{i.payment_status}</span></td><td><div className="actions"><Link className="btn" href={`/invoices/view?id=${i.id}`}>View</Link><Link className="btn" href={`/invoices/print?id=${i.id}`} target="_blank">Print</Link><a className="btn" href={`/api/invoices/${i.id}/pdf`}>PDF</a><button className="btn danger" type="button" disabled={deleting===i.id} onClick={()=>remove(i)}>{deleting===i.id?"Deleting...":"Delete"}</button></div></td></tr>)}
        {!filtered.length&&<tr><td colSpan={7} className="muted">No invoices found.</td></tr>}
      </tbody></table></div>
    </div>
  </>;
}
