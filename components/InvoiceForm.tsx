"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { calculateInvoice, type InvoiceLineInput } from "@/lib/calculations";
import { paymentValuesForMode, type PaymentEntryMode } from "@/lib/payment-entry";
import InvoicePreview from "@/components/InvoicePreview";
import PaymentEntry from "@/components/PaymentEntry";

export default function InvoiceForm({company,addresses,customers,items,taxRates}:{company:any,addresses:any[],customers:any[],items:any[],taxRates:any[]}){
  const router=useRouter();
  const [customerId,setCustomerId]=useState("");
  const [addressId,setAddressId]=useState("");
  const [invoiceDate,setInvoiceDate]=useState(new Date().toISOString().slice(0,10));
  const [dueDate,setDueDate]=useState("");
  const [terms,setTerms]=useState(company.default_terms??"");
  const [taxEnabled,setTaxEnabled]=useState(!!company.default_tax_enabled);
  const [taxRate,setTaxRate]=useState(Number(company.default_tax_rate??0));
  const [paymentStatus,setPaymentStatus]=useState<"UNPAID"|"PAID">("UNPAID");
  const [cashPaid,setCashPaid]=useState(0);
  const [cardPaid,setCardPaid]=useState(0);
  const [paymentMode,setPaymentMode]=useState<PaymentEntryMode>("");
  const [paymentDate,setPaymentDate]=useState("");
  const [notes,setNotes]=useState("");
  const [lines,setLines]=useState<InvoiceLineInput[]>([]);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");

  const customer=customers.find(c=>c.id===customerId);
  const address=addresses.find(a=>a.id===addressId);
  const calc=useMemo(()=>calculateInvoice(lines,taxEnabled,taxRate),[lines,taxEnabled,taxRate]);
  const paymentMade=paymentStatus==="PAID" ? Math.round((cashPaid+cardPaid+Number.EPSILON)*100)/100 : 0;

  useEffect(() => {
    if (!customer?.zip || !taxEnabled) return;
    const match = taxRates.find((t:any) => String(t.zip).trim() === String(customer.zip).trim());
    if (match) setTaxRate(Number(match.rate));
  }, [customer?.zip, taxEnabled, taxRates]);

  useEffect(() => {
    if (paymentMode !== "cash-full" && paymentMode !== "card-full") return;
    const payment = paymentValuesForMode(paymentMode, calc.total);
    setCashPaid(payment.cash);
    setCardPaid(payment.card);
  }, [calc.total, paymentMode]);

  function choosePaymentMode(mode: PaymentEntryMode) {
    setPaymentMode(mode);
    const payment = paymentValuesForMode(mode, calc.total);
    setCashPaid(payment.cash);
    setCardPaid(payment.card);
  }

  function addItem(itemId:string){
    const item=items.find(i=>i.id===itemId); if(!item)return;
    setLines(v=>[...v,{id:crypto.randomUUID(),name:item.name,description:item.description,qty:1,rate:Number(item.default_price),discountType:"fixed",discountValue:0,taxable:item.taxable}]);
  }
  function update(id:string,patch:Partial<InvoiceLineInput>){setLines(v=>v.map(l=>l.id===id?{...l,...patch}:l))}
  function remove(id:string){setLines(v=>v.filter(l=>l.id!==id))}
  async function save(){
    if (busy) return;
    if(!addressId){setError("Select a store before saving the invoice.");return;}
    if(!customerId){setError("Select a customer before saving the invoice.");return;}
    if(paymentStatus==="PAID"&&paymentMade<=0){setError("Enter the amount paid by cash, card, or both.");return;}
    if(paymentMade>calc.total){setError("Cash and card payments cannot be more than the invoice total.");return;}
    setBusy(true);setError("");
    try {
      const res=await fetch("/api/invoices",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        invoiceDate,dueDate,terms,taxEnabled,taxRate,paymentStatus,cashPaid,cardPaid,paymentDate,notes,
        customerId,addressId,lines
      })});
      if(!res.ok){const data=await res.json().catch(()=>({}));setError(data.error??"Could not save invoice.");return;}
      const data=await res.json();
      try {
        const driveRes = await fetch(`/api/invoices/${data.invoice.id}/drive`, { method: "POST" });
        if (!driveRes.ok) console.warn("Invoice saved, but Google Drive archive failed.");
      } catch (e) {
        console.warn("Invoice saved, but Google Drive archive failed.", e);
      }
      router.push(`/invoices/view?id=${data.invoice.id}&created=1`);
      router.refresh();
    } catch {
      setError("Could not save invoice. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const paymentReady=paymentStatus==="UNPAID"||paymentMade>0;

  return <>
    <div className="toolbar justify-between"><div><h1 className="page-title">New invoice</h1><p className="muted">Build a Letter-size invoice from your saved records.</p></div><button type="button" className="btn btn-primary" onClick={save} disabled={busy || !customer || !address || !lines.length || !paymentReady}>{busy&&<span className="loading loading-spinner loading-sm" aria-hidden="true"/>}{busy?"Saving…":"Save invoice"}</button></div>
    {error&&<div role="alert" className="alert alert-error alert-soft mb-4">{error}</div>}
    <div className="invoice-editor">
      <div className="grid">
        <div className="card">
          <h2 className="m-0 text-lg font-bold">Invoice details</h2>
          <div className="form-grid">
            <label>Store<select className="select" value={addressId} required onChange={e=>{setAddressId(e.target.value);if(!e.target.value)setCustomerId("");}}><option value="">Select a store</option>{addresses.map(a=><option key={a.id} value={a.id}>{a.name} — {a.city}, {a.state}</option>)}</select></label>
            <label>Customer<select className="select" value={customerId} required disabled={!addressId} onChange={e=>setCustomerId(e.target.value)}><option value="">{addressId?"Select a customer":"Select a store first"}</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name}{c.company_name?` — ${c.company_name}`:""}</option>)}</select></label>
            <label>Invoice date<input className="input" type="date" value={invoiceDate} onChange={e=>setInvoiceDate(e.target.value)}/></label>
            <label>Due date<input className="input" type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}/></label>
            <label className="full">Terms<textarea className="textarea" value={terms} onChange={e=>setTerms(e.target.value)}/></label>
          </div>
        </div>

        <div className="card">
          <h2 className="m-0 text-lg font-bold">Add saved item</h2>
          <label className="mt-3">Product or service<select className="select" value="" onChange={e=>{addItem(e.target.value);e.currentTarget.value=""}}>
            <option value="">Select an item or service</option>
            {items.map(i=><option key={i.id} value={i.id}>{i.name} — ${Number(i.default_price).toFixed(2)}</option>)}
          </select></label>
        </div>

        <div className="card">
          <h2 className="m-0 text-lg font-bold">Line items</h2>
          {!lines.length&&<div className="rounded-box border border-dashed border-base-300 bg-base-200/40 px-4 py-8 text-center text-sm text-base-content/55">No items yet. Choose a saved item above to begin.</div>}
          {lines.map((l)=><div className="line-editor" key={l.id}>
            <div className="line-grid">
              <label>Item<input className="input" value={l.name} onChange={e=>update(l.id,{name:e.target.value})}/></label>
              <label>Qty<input className="input" type="number" min="0" step="0.01" value={l.qty} onChange={e=>update(l.id,{qty:Number(e.target.value||0)})}/></label>
              <label>Rate<input className="input" type="number" min="0" step="0.01" value={l.rate} onChange={e=>update(l.id,{rate:Number(e.target.value||0)})}/></label>
              <label>Discount<input className="input" type="number" min="0" step="0.01" value={l.discountValue} onChange={e=>update(l.id,{discountValue:Number(e.target.value||0)})}/></label>
              <button className="btn btn-error btn-soft" type="button" onClick={()=>remove(l.id)}>Remove</button>
            </div>
            <div className="form-grid" style={{marginTop:8}}>
              <label>Description<textarea className="textarea" value={l.description} onChange={e=>update(l.id,{description:e.target.value})}/></label>
              <div className="grid">
                <label>Discount type<select className="select" value={l.discountType} onChange={e=>update(l.id,{discountType:e.target.value as any})}><option value="fixed">$ fixed</option><option value="percent">% percent</option></select></label>
                <label>Taxable<select className="select" value={String(l.taxable)} onChange={e=>update(l.id,{taxable:e.target.value==="true"})}><option value="true">Yes</option><option value="false">No</option></select></label>
              </div>
            </div>
          </div>)}
        </div>

        <div className="card">
          <h2 className="m-0 text-lg font-bold">Tax &amp; payment</h2>
          <div className="form-grid">
            <label>Tax<select className="select" value={String(taxEnabled)} onChange={e=>setTaxEnabled(e.target.value==="true")}><option value="false">No tax</option><option value="true">Tax enabled</option></select></label>
            <label>Tax rate (%)<input className="input" type="number" min="0" step="0.0001" disabled={!taxEnabled} value={taxRate} onChange={e=>setTaxRate(Number(e.target.value||0))}/></label>
            <label>ZIP tax lookup<select className="select" disabled={!taxEnabled} value="" onChange={e=>{const t=taxRates.find(x=>x.zip===e.target.value);if(t)setTaxRate(Number(t.rate));}}><option value="">Select ZIP rate...</option>{taxRates.map(t=><option key={t.id} value={t.zip}>{t.zip} — {t.rate}% {t.label}</option>)}</select></label>
            <label>Payment status<select className="select" value={paymentStatus} onChange={e=>{const value=e.target.value as "UNPAID"|"PAID";setPaymentStatus(value);if(value==="UNPAID"){setPaymentMode("");setCashPaid(0);setCardPaid(0);setPaymentDate("");}else if(!paymentDate){setPaymentDate(new Date().toISOString().slice(0,10));}}}><option value="UNPAID">Not paid</option><option value="PAID">Paid / payment received</option></select></label>
            {paymentStatus==="PAID"&&<PaymentEntry mode={paymentMode} total={calc.total} cashPaid={cashPaid} cardPaid={cardPaid} paymentMade={paymentMade} paymentDate={paymentDate} onModeChange={choosePaymentMode} onCashChange={setCashPaid} onCardChange={setCardPaid} onDateChange={setPaymentDate}/>}
            <label className="full">Internal notes<textarea className="textarea" value={notes} onChange={e=>setNotes(e.target.value)}/></label>
          </div>
        </div>
      </div>

      <details className="invoice-preview-toggle" open>
        <summary>Show invoice preview</summary>
        <div className="preview-wrap">
          <InvoicePreview company={company} address={address} customer={customer} invoiceNumber="PREVIEW" invoiceDate={invoiceDate} dueDate={dueDate} terms={terms} lines={calc.lines} subtotal={calc.subtotal} discount={calc.discount} tax={calc.tax} total={calc.total} cashPaid={cashPaid} cardPaid={cardPaid} paymentMade={paymentMade} balanceDue={Math.max(0,calc.total-paymentMade)} taxEnabled={taxEnabled} />
        </div>
      </details>
    </div>
  </>;
}
