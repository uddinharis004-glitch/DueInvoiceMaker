"use client";

import { useEffect, useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import Toast from "@/components/Toast";

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
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ kind: "address" | "tax"; id: string; label: string } | null>(null);

  async function load() {
    const responses = await Promise.all([fetch("/api/company"), fetch("/api/addresses"), fetch("/api/tax-rates")]);
    if (responses.some((response) => !response.ok)) throw new Error("Company settings could not be loaded.");
    const [c, a, t] = await Promise.all(responses.map((response) => response.json()));
    setCompany(c.company); setForm(c.company ?? {}); setAddresses(a.addresses ?? []); setTaxRates(t.taxRates ?? []);
  }
  useEffect(() => { load().catch((error) => setNotice({ message: error.message, tone: "error" })); }, []);

  async function saveCompany(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/company", { method: "PUT", headers: {"Content-Type":"application/json"}, body: JSON.stringify(form) });
      if (!res.ok) throw new Error("Company settings could not be saved.");
      setNotice({ message: "Company settings saved.", tone: "success" });
      await load();
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "Company settings could not be saved.", tone: "error" });
    } finally { setBusy(false); }
  }

  async function addAddress(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/addresses", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(addressForm) });
      if (!res.ok) throw new Error("Address could not be saved.");
      setAddressForm({}); await load(); setNotice({ message: "Business address added.", tone: "success" });
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "Address could not be saved.", tone: "error" });
    } finally { setBusy(false); }
  }

  async function addTax(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/tax-rates", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(taxForm) });
      if (!res.ok) throw new Error("ZIP tax rate could not be saved.");
      setTaxForm({zip:"",rate:"",label:""}); await load(); setNotice({ message: "ZIP tax rate saved.", tone: "success" });
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "ZIP tax rate could not be saved.", tone: "error" });
    } finally { setBusy(false); }
  }

  async function confirmDelete() {
    if (!pendingDelete || busy) return;
    setBusy(true);
    try {
      const endpoint = pendingDelete.kind === "address" ? "addresses" : "tax-rates";
      const response = await fetch(`/api/${endpoint}?id=${pendingDelete.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(`${pendingDelete.kind === "address" ? "Address" : "Tax rate"} could not be deleted.`);
      setNotice({ message: `${pendingDelete.label} deleted.`, tone: "success" });
      setPendingDelete(null);
      await load();
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "Record could not be deleted.", tone: "error" });
    } finally { setBusy(false); }
  }

  async function uploadLogo(file?: File) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return setNotice({ message: "Logo must be 2 MB or smaller.", tone: "error" });
    let upload = file;
    const objectUrl = URL.createObjectURL(file);
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = () => reject(new Error("Image could not be loaded."));
        element.src = objectUrl;
      });
      const scale = Math.min(1, 1200 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Image conversion is unavailable.");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", 0.92));
      if (!blob) throw new Error("Image conversion failed.");
      upload = new File([blob], "company-logo.jpg", {type:"image/jpeg"});
    } catch {
      return setNotice({ message: "Logo conversion failed. Choose a valid SVG, PNG, JPEG, or WebP image.", tone: "error" });
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
    if (upload.size > 2 * 1024 * 1024) return setNotice({ message: "Converted logo must be 2 MB or smaller.", tone: "error" });
    const fd = new FormData(); fd.append("file", upload);
    const res = await fetch("/api/company/logo", { method: "POST", body: fd });
    if (!res.ok) return setNotice({ message: "Logo upload failed.", tone: "error" });
    await load();
    setNotice({ message: "Company logo updated.", tone: "success" });
  }

  if (!company) return <div className="card grid gap-3" aria-label="Loading company settings" aria-busy="true"><div className="skeleton h-8 w-48" /><div className="skeleton h-12 w-full" /><div className="skeleton h-12 w-full" /><div className="skeleton h-28 w-full" /></div>;

  return (
    <>
      {notice && <Toast message={notice.message} tone={notice.tone} onDismiss={() => setNotice(null)} />}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Delete ${pendingDelete?.label ?? "record"}?`}
        description="This permanently removes the saved record and cannot be undone."
        busy={busy}
        onClose={() => !busy && setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
      <div className="toolbar justify-between">
        <div><h1 className="page-title">Company Profile</h1><p className="muted">Logo, defaults, business addresses and ZIP tax rates.</p></div>
      </div>

      <div className="grid grid-2">
        <form className="card grid" onSubmit={saveCompany}>
          <h2 className="m-0 text-lg font-bold">Company information</h2>
          <label>Company name<input className="input" value={form.name ?? ""} onChange={e=>setForm({...form,name:e.target.value})} required /></label>
          <label>Phone<input className="input" value={form.phone ?? ""} onChange={e=>setForm({...form,phone:e.target.value})} /></label>
          <label>Email<input className="input" type="email" value={form.email ?? ""} onChange={e=>setForm({...form,email:e.target.value})} /></label>
          <label>Website<input className="input" value={form.website ?? ""} onChange={e=>setForm({...form,website:e.target.value})} /></label>
          <label>Invoice prefix<input className="input" value={form.invoice_prefix ?? "INV-"} onChange={e=>setForm({...form,invoice_prefix:e.target.value})} /></label>
          <label>Next invoice number<input className="input" type="number" min="1" value={form.next_invoice_number ?? 1} onChange={e=>setForm({...form,next_invoice_number:Number(e.target.value||1)})} /></label>
          <label>Default tax enabled
            <select className="select" value={String(!!form.default_tax_enabled)} onChange={e=>setForm({...form,default_tax_enabled:e.target.value==="true"})}>
              <option value="false">No tax by default</option><option value="true">Tax enabled by default</option>
            </select>
          </label>
          <label>Default tax rate (%)<input className="input" type="number" step="0.0001" value={form.default_tax_rate ?? 0} onChange={e=>setForm({...form,default_tax_rate:Number(e.target.value||0)})} /></label>
          <label className="full">Default Terms & Conditions<textarea className="textarea" value={form.default_terms ?? ""} onChange={e=>setForm({...form,default_terms:e.target.value})} /></label>
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy&&<span className="loading loading-spinner loading-sm" aria-hidden="true"/>}Save company</button>
        </form>

        <div className="card">
          <h2 className="m-0 text-lg font-bold">Company logo</h2>
          {form.logo_data ? <img src={form.logo_data} alt="Company logo" className="mt-4 max-h-28 max-w-56 rounded-field border border-base-300 bg-base-100 object-contain p-3" /> : <div className="mt-4 rounded-box border border-dashed border-base-300 bg-base-200/40 px-4 py-8 text-center text-sm text-base-content/55">No logo uploaded.</div>}
          <label className="mt-4">Upload logo<input className="file-input w-full" type="file" accept="image/svg+xml,image/png,image/jpeg,image/webp,.svg" onChange={e=>uploadLogo(e.target.files?.[0])} /></label>
          <p className="mt-2 text-xs text-base-content/55">SVG, PNG, JPG or WebP. Saved in a PDF-compatible format. Maximum 2 MB.</p>
        </div>
      </div>

      <div className="grid grid-2 mt-5">
        <form className="card grid" onSubmit={addAddress}>
          <h2 className="m-0 text-lg font-bold">Business addresses</h2>
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
          <button type="submit" className="btn btn-primary" disabled={busy}>Add address</button>
          <div className="table-wrap"><table className="table responsive-table"><thead><tr><th>Name</th><th>Address</th><th>Default</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
            {addresses.map(a=><tr key={a.id}><td data-label="Name">{a.name}</td><td data-label="Address">{a.street}<br/>{a.city}, {a.state} {a.zip}</td><td data-label="Default">{a.is_default ? <span className="badge badge-success badge-soft badge-sm">Yes</span>:"—"}</td><td data-label=""><button type="button" className="btn btn-error btn-soft btn-sm" onClick={()=>setPendingDelete({kind:"address",id:a.id,label:a.name})}>Delete</button></td></tr>)}
          </tbody></table></div>
        </form>

        <form className="card grid" onSubmit={addTax}>
          <h2 className="m-0 text-lg font-bold">ZIP tax rates</h2>
          <p className="muted">Optional maintained lookup. Add the current rate you want the invoice maker to use for a ZIP code.</p>
          <div className="form-grid-3">
            <label>ZIP<input className="input" value={taxForm.zip} onChange={e=>setTaxForm({...taxForm,zip:e.target.value})} required /></label>
            <label>Rate %<input className="input" type="number" step="0.0001" value={taxForm.rate} onChange={e=>setTaxForm({...taxForm,rate:e.target.value})} required /></label>
            <label>Label<input className="input" value={taxForm.label} onChange={e=>setTaxForm({...taxForm,label:e.target.value})} placeholder="Local sales tax" /></label>
          </div>
          <button type="submit" className="btn btn-primary" disabled={busy}>Save ZIP rate</button>
          <div className="table-wrap"><table className="table responsive-table"><thead><tr><th>ZIP</th><th>Rate</th><th>Label</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
            {taxRates.map((t:any)=><tr key={t.id}><td data-label="ZIP">{t.zip}</td><td data-label="Rate">{t.rate}%</td><td data-label="Label">{t.label}</td><td data-label=""><button type="button" className="btn btn-error btn-soft btn-sm" onClick={()=>setPendingDelete({kind:"tax",id:t.id,label:`ZIP ${t.zip}`})}>Delete</button></td></tr>)}
          </tbody></table></div>
        </form>
      </div>
    </>
  );
}
