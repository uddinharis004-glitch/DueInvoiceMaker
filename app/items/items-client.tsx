"use client";

import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import Toast from "@/components/Toast";
import { getVisiblePages } from "@/lib/pagination";
import { money } from "@/lib/utils";
import ItemFormDialog, { type ItemFormValue } from "./item-form-dialog";

type Item = ItemFormValue & { id: string };
type Pagination = { page: number; pageSize: number; total: number; totalPages: number };

const empty: ItemFormValue = { name: "", description: "", default_price: "", sku: "", taxable: true };

export default function ItemsClient() {
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState<ItemFormValue>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 8, total: 0, totalPages: 1 });
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Item | null>(null);
  const [notice, setNotice] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "8" });
    if (debouncedQuery) params.set("q", debouncedQuery);

    fetch(`/api/items?${params}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Items could not be loaded.");
        return response.json();
      })
      .then((data) => {
        const nextPagination = data.pagination ?? { page: 1, pageSize: 8, total: 0, totalPages: 1 };
        if (page > nextPagination.totalPages) {
          setPage(nextPagination.totalPages);
          return;
        }
        setItems(data.items ?? []);
        setPagination(nextPagination);
      })
      .catch((error) => {
        if (error instanceof Error && error.name !== "AbortError") setNotice({ message: error.message, tone: "error" });
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });

    return () => controller.abort();
  }, [debouncedQuery, page, refreshKey]);

  function openNewItem() {
    setEditing(null);
    setForm(empty);
    setFormOpen(true);
  }

  function openEditItem(item: Item) {
    setEditing(item.id);
    setForm(item);
    setFormOpen(true);
  }

  function closeForm() {
    if (busy) return;
    setFormOpen(false);
    setEditing(null);
    setForm(empty);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
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
      setFormOpen(false);
      setEditing(null);
      setForm(empty);
      if (!wasEditing) {
        setQuery("");
        setDebouncedQuery("");
        setPage(1);
      }
      setRefreshKey((current) => current + 1);
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
      const deletedName = pendingDelete.name;
      setPendingDelete(null);
      if (items.length === 1 && page > 1) setPage((current) => current - 1);
      else setRefreshKey((current) => current + 1);
      setNotice({ message: `${deletedName} deleted.`, tone: "success" });
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "Item could not be deleted.", tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  const pages = useMemo(() => getVisiblePages(page, pagination.totalPages), [page, pagination.totalPages]);
  const firstResult = pagination.total ? (page - 1) * pagination.pageSize + 1 : 0;
  const lastResult = Math.min(page * pagination.pageSize, pagination.total);

  return (
    <>
      {notice && <Toast message={notice.message} tone={notice.tone} onDismiss={() => setNotice(null)} />}
      <ItemFormDialog open={formOpen} editing={Boolean(editing)} value={form} busy={busy} onChange={setForm} onClose={closeForm} onSubmit={save} />
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Delete ${pendingDelete?.name ?? "item"}?`}
        description="This removes the saved catalog item. Existing invoices will not be changed."
        busy={busy}
        onClose={() => !busy && setPendingDelete(null)}
        onConfirm={removeItem}
      />

      <div className="toolbar justify-between">
        <div><h1 className="page-title">Items</h1><p className="muted">Your most recently added products and services appear first.</p></div>
        <button type="button" className="btn btn-primary" onClick={openNewItem}>Add item</button>
      </div>

      <section className="card" aria-labelledby="item-list-heading">
        <div className="flex flex-col gap-3 border-b border-base-300 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="item-list-heading" className="text-lg font-bold">Saved items</h2>
            <p className="mt-1 text-sm text-base-content/55">Showing up to 8 items per page</p>
          </div>
          <label className="w-full sm:max-w-sm">
            <span className="text-xs font-semibold text-base-content/65">Search items</span>
            <input className="input" type="search" placeholder="Name, description or SKU" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} />
          </label>
        </div>

        {loading ? (
          <div className="mt-4 grid gap-3" aria-label="Loading items" aria-busy="true">
            {Array.from({ length: 4 }, (_, index) => <div key={index} className="skeleton h-16 w-full" />)}
          </div>
        ) : items.length ? (
          <>
            <div className="table-wrap mt-3">
              <table className="table responsive-table">
                <thead><tr><th>Item</th><th>SKU</th><th>Price</th><th>Taxable</th><th><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>{items.map((item) => (
                  <tr key={item.id}>
                    <td data-label="Item"><strong>{item.name}</strong><br /><span className="muted text-xs">{item.description || "No description"}</span></td>
                    <td data-label="SKU">{item.sku || "—"}</td>
                    <td data-label="Price" className="font-semibold">{money(item.default_price)}</td>
                    <td data-label="Taxable"><span className={`badge badge-soft badge-sm ${item.taxable ? "badge-success" : "badge-neutral"}`}>{item.taxable ? "Yes" : "No"}</span></td>
                    <td data-label=""><div className="actions justify-end"><button type="button" className="btn btn-sm" onClick={() => openEditItem(item)}>Edit</button><button type="button" className="btn btn-error btn-soft btn-sm" onClick={() => setPendingDelete(item)}>Delete</button></div></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-base-300 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-base-content/60">Showing {firstResult}–{lastResult} of {pagination.total}</p>
              <nav className="join" aria-label="Item pages">
                <button type="button" className="btn join-item" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>Previous</button>
                {pages.map((pageNumber) => (
                  <button type="button" key={pageNumber} className={`btn join-item ${pageNumber === page ? "btn-active" : ""}`} aria-current={pageNumber === page ? "page" : undefined} aria-label={`Page ${pageNumber}`} onClick={() => setPage(pageNumber)}>{pageNumber}</button>
                ))}
                <button type="button" className="btn join-item" disabled={page === pagination.totalPages} onClick={() => setPage((current) => current + 1)}>Next</button>
              </nav>
            </div>
          </>
        ) : (
          <div className="py-12 text-center" role="status">
            <h3 className="font-semibold">{debouncedQuery ? "No matching items" : "No items yet"}</h3>
            <p className="mt-1 text-sm text-base-content/55">{debouncedQuery ? "Try a different search." : "Add your first product or service to get started."}</p>
            {!debouncedQuery && <button type="button" className="btn btn-primary mt-4" onClick={openNewItem}>Add item</button>}
          </div>
        )}
      </section>
    </>
  );
}
