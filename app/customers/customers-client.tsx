"use client";

import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import Toast from "@/components/Toast";
import CustomerFormDialog, { type CustomerFormValue } from "./customer-form-dialog";

type Customer = CustomerFormValue & { id: string };
type Pagination = { page: number; pageSize: number; total: number; totalPages: number };

const empty: CustomerFormValue = { name: "", company_name: "", street: "", city: "", state: "", zip: "", phone: "", email: "", notes: "" };

function visiblePages(current: number, total: number) {
  const start = Math.max(1, Math.min(current - 2, total - 4));
  const end = Math.min(total, start + 4);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export default function CustomersClient() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState<CustomerFormValue>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 8, total: 0, totalPages: 1 });
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Customer | null>(null);
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

    fetch(`/api/customers?${params}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Customers could not be loaded.");
        return response.json();
      })
      .then((data) => {
        const nextPagination = data.pagination ?? { page: 1, pageSize: 8, total: 0, totalPages: 1 };
        if (page > nextPagination.totalPages) {
          setPage(nextPagination.totalPages);
          return;
        }
        setCustomers(data.customers ?? []);
        setPagination(nextPagination);
      })
      .catch((error) => {
        if (error instanceof Error && error.name !== "AbortError") setNotice({ message: error.message, tone: "error" });
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });

    return () => controller.abort();
  }, [debouncedQuery, page, refreshKey]);

  function openNewCustomer() {
    setEditing(null);
    setForm(empty);
    setFormOpen(true);
  }

  function openEditCustomer(customer: Customer) {
    setEditing(customer.id);
    setForm(customer);
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
      const response = await fetch(editing ? `/api/customers?id=${editing}` : "/api/customers", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error("Customer could not be saved.");
      setFormOpen(false);
      setEditing(null);
      setForm(empty);
      if (!wasEditing) {
        setQuery("");
        setDebouncedQuery("");
        setPage(1);
      }
      setRefreshKey((current) => current + 1);
      setNotice({ message: wasEditing ? "Customer updated." : "Customer added.", tone: "success" });
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "Customer could not be saved.", tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function removeCustomer() {
    if (!pendingDelete || busy) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/customers?id=${pendingDelete.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Customer could not be deleted.");
      const deletedName = pendingDelete.name;
      setPendingDelete(null);
      if (customers.length === 1 && page > 1) setPage((current) => current - 1);
      else setRefreshKey((current) => current + 1);
      setNotice({ message: `${deletedName} deleted.`, tone: "success" });
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "Customer could not be deleted.", tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  const pages = useMemo(() => visiblePages(page, pagination.totalPages), [page, pagination.totalPages]);
  const firstResult = pagination.total ? (page - 1) * pagination.pageSize + 1 : 0;
  const lastResult = Math.min(page * pagination.pageSize, pagination.total);

  return (
    <>
      {notice && <Toast message={notice.message} tone={notice.tone} onDismiss={() => setNotice(null)} />}
      <CustomerFormDialog open={formOpen} editing={Boolean(editing)} value={form} busy={busy} onChange={setForm} onClose={closeForm} onSubmit={save} />
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Delete ${pendingDelete?.name ?? "customer"}?`}
        description="This removes the saved customer record. Existing invoices will keep their customer snapshot."
        busy={busy}
        onClose={() => !busy && setPendingDelete(null)}
        onConfirm={removeCustomer}
      />

      <div className="toolbar justify-between">
        <div><h1 className="page-title">Customers</h1><p className="muted">Your most recently added customers appear first.</p></div>
        <button type="button" className="btn btn-primary" onClick={openNewCustomer}>Add customer</button>
      </div>

      <section className="card" aria-labelledby="customer-list-heading">
        <div className="flex flex-col gap-3 border-b border-base-300 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="customer-list-heading" className="text-lg font-bold">Saved customers</h2>
            <p className="mt-1 text-sm text-base-content/55">Showing up to 8 customers per page</p>
          </div>
          <label className="w-full sm:max-w-sm">
            <span className="text-xs font-semibold text-base-content/65">Search customers</span>
            <input className="input" type="search" placeholder="Name, company, email or phone" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} />
          </label>
        </div>

        {loading ? (
          <div className="mt-4 grid gap-3" aria-label="Loading customers" aria-busy="true">
            {Array.from({ length: 4 }, (_, index) => <div key={index} className="skeleton h-16 w-full" />)}
          </div>
        ) : customers.length ? (
          <>
            <div className="table-wrap mt-3">
              <table className="table responsive-table">
                <thead><tr><th>Name</th><th>Company</th><th>Contact</th><th><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>{customers.map((customer) => (
                  <tr key={customer.id}>
                    <td data-label="Name"><strong>{customer.name}</strong><br /><span className="muted text-xs">{[customer.street, customer.city, customer.state, customer.zip].filter(Boolean).join(" ")}</span></td>
                    <td data-label="Company">{customer.company_name || "—"}</td>
                    <td data-label="Contact">{customer.phone || "—"}<br />{customer.email}</td>
                    <td data-label=""><div className="actions justify-end"><button type="button" className="btn btn-sm" onClick={() => openEditCustomer(customer)}>Edit</button><button type="button" className="btn btn-error btn-soft btn-sm" onClick={() => setPendingDelete(customer)}>Delete</button></div></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-base-300 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-base-content/60">Showing {firstResult}–{lastResult} of {pagination.total}</p>
              <nav className="join" aria-label="Customer pages">
                <button type="button" className="btn join-item" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>Previous</button>
                {pages.map((pageNumber) => (
                  <button
                    type="button"
                    key={pageNumber}
                    className={`btn join-item ${pageNumber === page ? "btn-active" : ""}`}
                    aria-current={pageNumber === page ? "page" : undefined}
                    aria-label={`Page ${pageNumber}`}
                    onClick={() => setPage(pageNumber)}
                  >{pageNumber}</button>
                ))}
                <button type="button" className="btn join-item" disabled={page === pagination.totalPages} onClick={() => setPage((current) => current + 1)}>Next</button>
              </nav>
            </div>
          </>
        ) : (
          <div className="py-12 text-center" role="status">
            <h3 className="font-semibold">{debouncedQuery ? "No matching customers" : "No customers yet"}</h3>
            <p className="mt-1 text-sm text-base-content/55">{debouncedQuery ? "Try a different search." : "Add your first customer to get started."}</p>
            {!debouncedQuery && <button type="button" className="btn btn-primary mt-4" onClick={openNewCustomer}>Add customer</button>}
          </div>
        )}
      </section>
    </>
  );
}
