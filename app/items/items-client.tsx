use client';

import { useEffect, useState } from "react";

const empty={name:"",description:"",default_price:"",sku:"",taxable:true};

export default function ItemsClient(){
  const [items,setItems]=useState<any[]>([]);
  const [form,setForm]=useState<any>(empty);
  const [editing,setEditing]=useState<string|null>(null);
  const [q,setQ]=useState("");
  async function load(){const r=await fetch("/api/items");const d=await r.json();setItems(d.items??[])}
  useEffect(()=>{load()},[]);
  async function save(e:React.FormEvent){
    e.preventDefault(); const url=editing?`/api/items?id=${editing}`:"/api/items";
    await fetch(url,{method:editing?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
    setForm(empty);setEditing(null);load();
  }
  async function remove(id:string){if(!confirm("Delete item?"))return;await fetch(`/api/items?id=${id}`,{method:"DELETE"});load();}
  const filtered=items.filter(i=>`${i.name} ${i.description} ${i.sku}`.toLowerCase().includes(q.toLowerCase()));
  return <>
    <div className="toolbar"><div><h1 className="page-title">Items</h1><p className="muted">Saved products/services. Price can still be changed on each invoice.</p></div></div>
    <div className="grid grid-2">
      <form className="card grid" onSubmit={save}>
        <h2 style={{marginTop:0}}>{editing?"Edit item":"Add item"}</h2>
        <label>Name<input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></label>
        <label>Description<textarea className="textarea" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
        <div className="form-grid">
          <label>Default price<input className="input" type="number" step="0.01" min="0" value={form.default_price} onChange={e=>setForm({...form,default_price:e.target.value})} required/></label>
          <label>SKU<input className="input" value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})}/></label>
        </div>
        <label>Taxable
          <select className="select" value={String(form.taxable)} onChange={e=>setForm({...form,taxable:e.target.value==="true"})}><option value="true">Yes</option><option value="false">No</option></select>
        </label>
        <div className="actions"><button className="btn primary">{editing?"Update":"Save"} item</button>{editing&&<button type="button" className="btn" onClick={()=>{setEditing(null);setForm(empty)}}>Cancel</button>}</div>
      </form>
      <div className="card">
        <input className="input" placeholder="Search items..." value={q} onChange={e=>setQ(e.target.value)}/>
        <div className="table-wrap" style={{marginTop:12}}><table><thead><tr><th>Item</th><th>Price</th><th>Taxable</th><th></th></tr></thead><tbody>
          {filtered.map(i=><tr key={i.id}><td><strong>{i.name}</strong><br/><span className="muted">{i.description}</span></td><td>${Number(i.default_price).toFixed(2)}</td><td>{i.taxable?"Yes":"No"}</td><td><div className="actions"><button className="btn" onClick={()=>{setEditing(i.id);setForm(i)}}>Edit</button><button className="btn danger" onClick={()=>remove(i.id)}>Delete</button></div></td></tr>)}
        </tbody></table></div>
      </div>
    </div>
  </>;
}
