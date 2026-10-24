"use client";

import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import Toast from "@/components/Toast";
import { money } from "@/lib/utils";

type Item = {
  id: string;
  name: string;
  description: string;
  default_price: string;
  sku: string;
  taxable: boolean;
};

const empty = { name: "", description: "", default_price: "", sku: "", taxable: true };

export default function ItemsClient() {
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Item | null>(null);
  const [notice, setNotice] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  async function loadItems() {
    const response = await fetch("/api/items");
    if (!response.ok) throw new Error("Items could not be loaded.");
    const data = await response.json();
    setItems(data.items ?? []);
  }

  useEffect(() => {
    let active = true;
    loadItems()
      .catch((error) => active && setNotice({ message: error.message, tone: "error" }))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const wasEditing = Boolean(editing);
      const response = await fetch(editing ? `/api/items?id=${editing}` : "/api/items", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error("Item could not be saved.");
      setForm(empty);
      setEditing(null);
      await loadItems();
      setNotice({ message: wasEditing ? "Item updated." : "Item added.", tone: "success" });
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "Item could not be saved.", tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function removeItem() {
    if (!pendingDelete || busy) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/items?id=${pendingDelete.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Item could not be deleted.");
      setItems((current) => current.filter((item) => item.id !== pendingDelete.id));
      setNotice({ message: `${pendingDelete.name} deleted.`, tone: "success" });
      setPendingDelete(null);
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "Item could not be deleted.", tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  const filtered = useMemo(() => items.filter((item) => (
    `${item.name} ${item.description} ${item.sku}`.toLowerCase().includes(query.toLowerCase())
  )), [items, query]);

  return (
    <>
      {notice && <Toast message={notice.message} tone={notice.tone} onDismiss={() => setNotice(null)} />}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Delete ${pendingDelete?.name ?? "item"}?`}
        description="This removes the saved catalog item. Existing invoices will not be changed."
        busy={busy}
        onClose={() => !busy && setPendingDelete(null)}
        onConfirm={removeItem}
      />

      <div className="toolbar">
        <div><h1 className="page-title">Items</h1><p className="muted">Reusable products and services for faster invoice creation.</p></div>
      </div>

      <div className="grid grid-2">
        <form className="card grid" onSubmit={save}>
          <div><h2 className="m-0 text-lg font-bold">{editing ? "Edit item" : "Add item"}</h2><p className="mt-1 text-sm text-base-content/55">Default pricing can still be changed per invoice.</p></div>
          <label>Name<input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
          <label>Description<textarea className="textarea" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
          <div className="form-grid">
            <label>Default price<input className="input" type="number" step="0.01" min="0" value={form.default_price} onChange={(event) => setForm({ ...form, default_price: event.target.value })} required /></label>
            <label>SKU<input className="input" value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} /></label>
          </div>
          <label>Taxable<select className="select" value={String(form.taxable)} onChange={(event) => setForm({ ...form, taxable: event.target.value === "true" })}><option value="true">Yes</option><option value="false">No</option></select></label>
          <div className="actions">
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy && <span className="loading loading-spinner loading-sm" aria-hidden="true" />}{editing ? "Update item" : "Save item"}</button>
            {editing && <button type="button" className="btn" disabled={busy} onClick={() => { setEditing(null); setForm(empty); }}>Cancel</button>}
          </div>
        </form>

        <section className="card" aria-labelledby="item-list-heading">
          <h2 id="item-list-heading" className="sr-only">Saved items</h2>
          <label><span className="text-xs font-semibold text-base-content/65">Search items</span><input className="input" type="search" placeholder="Name, description or SKU" value={query} onChange={(event) => setQuery(event.target.value)} /></label>

          {loading ? (
            <div className="mt-4 grid gap-3" aria-label="Loading items" aria-busy="true"><div className="skeleton h-16 w-full" /><div className="skeleton h-16 w-full" /><div className="skeleton h-16 w-full" /></div>
          ) : filtered.length ? (
            <div className="table-wrap mt-3">
              <table className="table responsive-table">
                <thead><tr><th>Item</th><th>Price</th><th>Taxable</th><th><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>{filtered.map((item) => (
                  <tr key={item.id}>
                    <td data-label="Item"><strong>{item.name}</strong><br /><span className="muted text-xs">{item.description}</span></td>
                    <td data-label="Price" className="font-semibold">{money(item.default_price)}</td>
                    <td data-label="Taxable"><span className={`badge badge-soft badge-sm ${item.taxable ? "badge-success" : "badge-neutral"}`}>{item.taxable ? "Yes" : "No"}</span></td>
                    <td data-label=""><div className="actions justify-end"><button type="button" className="btn btn-sm" onClick={() => { setEditing(item.id); setForm(item); }}>Edit</button><button type="button" className="btn btn-error btn-soft btn-sm" onClick={() => setPendingDelete(item)}>Delete</button></div></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center" role="status"><h3 className="font-semibold">No items found</h3><p className="mt-1 text-sm text-base-content/55">Add an item or change your search.</p></div>
          )}
        </section>
      </div>
    </>
  );
}
