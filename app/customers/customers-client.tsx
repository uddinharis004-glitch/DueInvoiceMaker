"use client";

import { useEffect, useState } from "react";
import Toast from "@/components/Toast";

const empty = {name:"",company_name:"",street:"",city:"",state:"",zip:"",phone:"",email:"",notes:""};

export default function CustomersClient() {
  const [customers,setCustomers]=useState<any[]>([]);
  const [form,setForm]=useState<any>(empty);
  const [editing,setEditing]=useState<string|null>(null);
  const [q,setQ]=useState("");
  const [message,setMessage]=useState("");

  async function load(){ const r=await fetch("/api/customers"); const d=await r.json(); setCustomers(d.customers??[]); }
  useEffect(()=>{load()},[]);

  async function save(e:React.FormEvent){
    e.preventDefault();
    const url=editing?`/api/customers?id=${editing}`:"/api/customers";
    const wasEditing=!!editing;
    const response=await fetch(url,{method:editing?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
    if(!response.ok)return;
    setForm(empty);setEditing(null);await load();setMessage(wasEditing?"Customer updated successfully.":"Customer added successfully.");
  }
  async function remove(id:string){if(!confirm("Delete customer?"))return;await fetch(`/api/customers?id=${id}`,{method:"DELETE"});load();}
  const filtered=customers.filter(c=>`${c.name} ${c.company_name} ${c.email}`.toLowerCase().includes(q.toLowerCase()));

  return <>
    {message&&<Toast message={message} onDismiss={()=>setMessage("")}/>}
    <div className="toolbar"><div><h1 className="page-title">Customers</h1><p className="muted">Reusable customer records.</p></div></div>
    <div className="grid grid-2">
      <form className="card grid" onSubmit={save}>
        <h2 style={{marginTop:0}}>{editing?"Edit customer":"Add customer"}</h2>
        <div className="form-grid">
          <label>Name<input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></label>
          <label>Company<input className="input" value={form.company_name} onChange={e=>setForm({...form,company_name:e.target.value})}/></label>
          <label>Street<input className="input" value={form.street} onChange={e=>setForm({...form,street:e.target.value})}/></label>
          <label>City<input className="input" value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/></label>
          <label>State<input className="input" value={form.state} onChange={e=>setForm({...form,state:e.target.value})}/></label>
          <label>ZIP<input className="input" value={form.zip} onChange={e=>setForm({...form,zip:e.target.value})}/></label>
          <label>Phone<input className="input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
          <label>Email<input className="input" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
          <label className="full">Notes<textarea className="textarea" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label>
        </div>
        <div className="actions"><button className="btn primary">{editing?"Update":"Save"} customer</button>{editing&&<button type="button" className="btn" onClick={()=>{setEditing(null);setForm(empty)}}>Cancel</button>}</div>
      </form>
      <div className="card">
        <div className="toolbar"><input className="input" placeholder="Search customers..." value={q} onChange={e=>setQ(e.target.value)}/></div>
        <div className="table-wrap"><table><thead><tr><th>Name</th><th>Company</th><th>Contact</th><th></th></tr></thead><tbody>
          {filtered.map(c=><tr key={c.id}><td><strong>{c.name}</strong><br/><span className="muted">{c.street} {c.city} {c.state} {c.zip}</span></td><td>{c.company_name}</td><td>{c.phone}<br/>{c.email}</td><td><div className="actions"><button className="btn" onClick={()=>{setEditing(c.id);setForm(c)}}>Edit</button><button className="btn danger" onClick={()=>remove(c.id)}>Delete</button></div></td></tr>)}
        </tbody></table></div>
      </div>
    </div>
  </>;
}
