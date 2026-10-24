"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import StatusBadge from "@/components/StatusBadge";
import Toast from "@/components/Toast";
import { formatShortDate, money } from "@/lib/utils";

type InvoiceRecord = {
  id: string;
  invoice_number: string;
  invoice_date: string;
  total: unknown;
  balance_due: unknown;
  payment_status: string;
  customer_snapshot?: { name?: string; company_name?: string };
};

export default function InvoicesClient({ initial }: { initial: InvoiceRecord[] }) {
  const [invoices, setInvoices] = useState(initial);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [pendingDelete, setPendingDelete] = useState<InvoiceRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  const filtered = useMemo(() => invoices.filter((invoice) => {
    const text = `${invoice.invoice_number} ${invoice.customer_snapshot?.name ?? ""} ${invoice.customer_snapshot?.company_name ?? ""}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (status === "ALL" || invoice.payment_status === status);
  }), [invoices, query, status]);

  async function removeInvoice() {
    if (!pendingDelete || deleting) return;
    setDeleting(true);

    try {
      const response = await fetch(`/api/invoices?id=${encodeURIComponent(pendingDelete.id)}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Invoice could not be deleted.");
      }

      setInvoices((current) => current.filter((item) => item.id !== pendingDelete.id));
      setNotice({ message: `Invoice ${pendingDelete.invoice_number} deleted.`, tone: "success" });
      setPendingDelete(null);
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "Invoice could not be deleted.", tone: "error" });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      {notice && <Toast message={notice.message} tone={notice.tone} onDismiss={() => setNotice(null)} />}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Delete ${pendingDelete?.invoice_number ?? "invoice"}?`}
        description="This permanently removes the saved invoice and cannot be undone."
        busy={deleting}
        onClose={() => !deleting && setPendingDelete(null)}
        onConfirm={removeInvoice}
      />

      <div className="toolbar justify-between">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="muted">Review saved invoices, balances and payment status.</p>
        </div>
        <Link className="btn btn-primary" href="/invoices/new"><span aria-hidden="true">+</span> New invoice</Link>
      </div>

      <section className="card" aria-label="Saved invoices">
        <div className="toolbar">
          <label className="w-full max-w-md">
            <span className="text-xs font-semibold text-base-content/65">Search invoices</span>
            <input
              className="input"
              type="search"
              placeholder="Invoice number or customer"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label className="w-full sm:max-w-48">
            <span className="text-xs font-semibold text-base-content/65">Payment status</span>
            <select className="select" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="ALL">All statuses</option>
              <option value="PAID">Paid</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PARTIAL">Partial</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </label>
        </div>

        <div className="table-wrap">
          <table className="table responsive-table">
            <thead><tr><th>Invoice</th><th>Customer</th><th>Date</th><th>Total</th><th>Balance</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {filtered.map((invoice) => (
                <tr key={invoice.id}>
                  <td data-label="Invoice"><Link className="link link-hover font-semibold" href={`/invoices/view?id=${invoice.id}`}>{invoice.invoice_number}</Link></td>
                  <td data-label="Customer">{invoice.customer_snapshot?.name || "—"}</td>
                  <td data-label="Date">{formatShortDate(invoice.invoice_date)}</td>
                  <td data-label="Total" className="font-semibold">{money(invoice.total)}</td>
                  <td data-label="Balance">{money(invoice.balance_due)}</td>
                  <td data-label="Status"><StatusBadge status={invoice.payment_status} /></td>
                  <td data-label="">
                    <div className="actions justify-end">
                      <Link className="btn btn-sm" href={`/invoices/view?id=${invoice.id}`}>View</Link>
                      <Link className="btn btn-sm" href={`/invoices/print?id=${invoice.id}`} target="_blank">Print</Link>
                      <a className="btn btn-sm" href={`/api/invoices/${invoice.id}/pdf`}>PDF</a>
                      <button className="btn btn-error btn-soft btn-sm" type="button" onClick={() => setPendingDelete(invoice)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!filtered.length && (
          <div className="py-12 text-center" role="status">
            <div className="mx-auto mb-3 grid size-11 place-items-center rounded-full bg-base-200 text-base-content/45" aria-hidden="true">⌕</div>
            <h2 className="font-semibold">No invoices found</h2>
            <p className="mt-1 text-sm text-base-content/55">Try a different search or payment status.</p>
          </div>
        )}
      </section>
    </>
  );
}
