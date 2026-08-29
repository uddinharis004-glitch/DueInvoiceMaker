"use client";

import { useEffect, useState } from "react";

type Company = any;
type Address = any;
type TaxRate = any;

export default function CompanyClient() {
  const [company, setCompany] = useState<Company | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [form, setForm] = useState<any>({});
  const [addressForm, setAddressForm] = useState<any>({});
  const [taxForm, setTaxForm] = useState<any>({ zip: "", rate: "", label: "" });
  const [message, setMessage] = useState("");

  async function load() {
    const [c, a, t] = await Promise.all([
      fetch("/api/company").then(r => r.json()),
      fetch("/api/addresses").then(r => r.json()),
      fetch("/api/tax-rates").then(r => r.json()),
    ]);
    setCompany(c.company); setForm(c.company ?? {}); setAddresses(a.addresses ?? []); setTaxRates(t.taxRates ?? []);
  }
  useEffect(() => { load(); }, []);

  async function saveCompany(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/company", { method: "PUT", headers: {"Content-Type":"application/json"}, body: JSON.stringify(form) });
    if (res.ok) { setMessage("Company saved."); await load(); }
  }

  async function addAddress(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/addresses", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(addressForm) });
    if (res.ok) { setAddressForm({}); await load(); }
  }

  async function removeAddress(id: string) {
    if (!confirm("Delete this address?")) return;
    await fetch(`/api/addresses?id=${id}`, { method: "DELETE" });
    await load();
  }

  async function addTax(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/tax-rates", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(taxForm) });
    if (res.ok) { setTaxForm({zip:"",rate:"",label:""}); await load(); }
  }

  async function removeTax(id: string) {
    await fetch(`/api/tax-rates?id=${id}`, { method: "DELETE" });
    await load();
  }

  async function uploadLogo(file?: File) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return alert("Logo must be 2 MB or smaller.");
    let upload = file;
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Image conversion is unavailable.");
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Image conversion failed.");
      upload = new File([blob], "company-logo.png", {type:"image/png"});
    } catch {
      return alert("Logo conversion failed. Please choose a PNG or JPEG image.");
    }
    if (upload.size > 2 * 1024 * 1024) return alert("Converted logo must be 2 MB or smaller.");
    const fd = new FormData(); fd.append("file", upload);
    const res = await fetch("/api/company/logo", { method: "POST", body: fd });
    if (!res.ok) return alert("Logo upload failed.");
    await load();
  }

  if (!company) return <div className="card">Loading...</div>;

  return (
    <>
      <div className="toolbar" style={{justifyContent:"space-between"}}>
        <div><h1 className="page-title">Company Profile</h1><p className="muted">Logo, defaults, business addresses and ZIP tax rates.</p></div>
        {message && <span className="muted">{message}</span>}
      </div>

      <div className="grid grid-2">
        <form className="card grid" onSubmit={saveCompany}>
          <h2 style={{marginTop:0}}>Company information</h2>
          <label>Company name<input className="input" value={form.name ?? ""} onChange={e=>setForm({...form,name:e.target.value})} required /></label>
          <label>Phone<input className="input" value={form.phone ?? ""} onChange={e=>setForm({...form,phone:e.target.value})} /></label>
          <label>Email<input className="input" type="email" value={form.email ?? ""} onChange={e=>setForm({...form,email:e.target.value})} /></label>
          <label>Website<input className="input" value={form.website ?? ""} onChange={e=>setForm({...form,website:e.target.value})} /></label>
          <label>Invoice prefix<input className="input" value={form.invoice_prefix ?? "INV-"} onChange={e=>setForm({...form,invoice_prefix:e.target.value})} /></label>
          <label>Next invoice number<input className="input" type="number" min="1" value={form.next_invoice_number ?? 1} onChange={e=>setForm({...form,next_invoice_number:Number(e.target.value)})} /></label>
          <label>Default tax enabled
            <select className="select" value={String(!!form.default_tax_enabled)} onChange={e=>setForm({...form,default_tax_enabled:e.target.value==="true"})}>
              <option value="false">No tax by default</option><option value="true">Tax enabled by default</option>
            </select>
          </label>
          <label>Default tax rate (%)<input className="input" type="number" step="0.0001" value={form.default_tax_rate ?? 0} onChange={e=>setForm({...form,default_tax_rate:Number(e.target.value)})} /></label>
          <label className="full">Default Terms & Conditions<textarea className="textarea" value={form.default_terms ?? ""} onChange={e=>setForm({...form,default_terms:e.target.value})} /></label>
          <button className="btn primary">Save company</button>
        </form>

        <div className="card">
          <h2 style={{marginTop:0}}>Company logo</h2>
          {form.logo_data ? <img src={form.logo_data} alt="Company logo" style={{maxWidth:220,maxHeight:100,objectFit:"contain",border:"1px solid #eee",padding:10}} /> : <p className="muted">No logo uploaded.</p>}
          <div style={{marginTop:16}}>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>uploadLogo(e.target.files?.[0])} />
            <p className="muted">PNG, JPG or WebP. Saved as a PDF-compatible PNG. Maximum 2 MB.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{marginTop:20}}>
        <form className="card grid" onSubmit={addAddress}>
          <h2 style={{marginTop:0}}>Business addresses</h2>
          <div className="form-grid">
            <label>Address name<input className="input" value={addressForm.name ?? ""} onChange={e=>setAddressForm({...addressForm,name:e.target.value})} placeholder="Chicago Office" required /></label>
            <label>Street<input className="input" value={addressForm.street ?? ""} onChange={e=>setAddressForm({...addressForm,street:e.target.value})} required /></label>
            <label>City<input className="input" value={addressForm.city ?? ""} onChange={e=>setAddressForm({...addressForm,city:e.target.value})} required /></label>
            <label>State<input className="input" value={addressForm.state ?? ""} onChange={e=>setAddressForm({...addressForm,state:e.target.value})} required /></label>
            <label>ZIP<input className="input" value={addressForm.zip ?? ""} onChange={e=>setAddressForm({...addressForm,zip:e.target.value})} required /></label>
            <label>Phone<input className="input" value={addressForm.phone ?? ""} onChange={e=>setAddressForm({...addressForm,phone:e.target.value})} /></label>
          </div>
          <label>Set as default
            <select className="select" value={String(!!addressForm.is_default)} onChange={e=>setAddressForm({...addressForm,is_default:e.target.value==="true"})}>
              <option value="false">No</option><option value="true">Yes</option>
            </select>
          </label>
          <button className="btn primary">Add address</button>
          <div className="table-wrap"><table><thead><tr><th>Name</th><th>Address</th><th>Default</th><th></th></tr></thead><tbody>
            {addresses.map(a=><tr key={a.id}><td>{a.name}</td><td>{a.street}<br/>{a.city}, {a.state} {a.zip}</td><td>{a.is_default ? "Yes":""}</td><td><button type="button" className="btn danger" onClick={()=>removeAddress(a.id)}>Delete</button></td></tr>)}
          </tbody></table></div>
        </form>

        <form className="card grid" onSubmit={addTax}>
          <h2 style={{marginTop:0}}>ZIP tax rates</h2>
          <p className="muted">Optional maintained lookup. Add the current rate you want the invoice maker to use for a ZIP code.</p>
          <div className="form-grid-3">
            <label>ZIP<input className="input" value={taxForm.zip} onChange={e=>setTaxForm({...taxForm,zip:e.target.value})} required /></label>
            <label>Rate %<input className="input" type="number" step="0.0001" value={taxForm.rate} onChange={e=>setTaxForm({...taxForm,rate:e.target.value})} required /></label>
            <label>Label<input className="input" value={taxForm.label} onChange={e=>setTaxForm({...taxForm,label:e.target.value})} placeholder="Local sales tax" /></label>
          </div>
          <button className="btn primary">Save ZIP rate</button>
          <div className="table-wrap"><table><thead><tr><th>ZIP</th><th>Rate</th><th>Label</th><th></th></tr></thead><tbody>
            {taxRates.map((t:any)=><tr key={t.id}><td>{t.zip}</td><td>{t.rate}%</td><td>{t.label}</td><td><button type="button" className="btn danger" onClick={()=>removeTax(t.id)}>Delete</button></td></tr>)}
          </tbody></table></div>
        </form>
      </div>
    </>
  );
}
