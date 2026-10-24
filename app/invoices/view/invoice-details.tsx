"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import InvoicePreview from "@/components/InvoicePreview";
import Toast from "@/components/Toast";
import { money } from "@/lib/utils";

export default function InvoiceDetails({ id, created = false }: { id: string; created?: boolean }) {
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [driveBusy, setDriveBusy] = useState(false);
  const [notice, setNotice] = useState<{ message: string; tone: "success" | "error" } | null>(
    created ? { message: "Invoice created successfully.", tone: "success" } : null,
  );

  async function loadInvoice(signal?: AbortSignal) {
    const response = await fetch(`/api/invoices?id=${id}`, { signal });
    if (!response.ok) throw new Error("Invoice could not be loaded.");
    const data = await response.json();
    setInvoice(data.invoice);
  }

  useEffect(() => {
    const controller = new AbortController();

    async function run() {
      try {
        const response = await fetch(`/api/invoices?id=${id}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Invoice could not be loaded.");
        const data = await response.json();
        setInvoice(data.invoice);
      } catch (error) {
        if (!controller.signal.aborted) setNotice({ message: error instanceof Error ? error.message : "Invoice could not be loaded.", tone: "error" });
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void run();
    return () => controller.abort();
  }, [id]);

  async function saveToDrive() {
    if (driveBusy) return;
    setDriveBusy(true);
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/drive`, { method: "POST" });
      if (!response.ok) throw new Error("Google Drive upload failed.");
      const data = await response.json();
      setNotice({ message: `Saved to Google Drive: ${data.file?.name ?? "PDF"}`, tone: "success" });
      await loadInvoice();
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "Google Drive upload failed.", tone: "error" });
    } finally {
      setDriveBusy(false);
    }
  }

  if (loading) return <div className="card grid gap-3" aria-label="Loading invoice" aria-busy="true"><div className="skeleton h-8 w-48" /><div className="skeleton h-96 w-full" /></div>;
  if (!invoice) return <div role="alert" className="alert alert-error alert-soft">Invoice not found.</div>;

  return (
    <>
      {notice && <Toast message={notice.message} tone={notice.tone} onDismiss={() => setNotice(null)} />}
      <div className="toolbar justify-between">
        <div><h1 className="page-title">{invoice.invoice_number}</h1><p className="muted">{invoice.customer_snapshot?.name} · {money(invoice.total)}</p></div>
        <div className="actions">
          <Link className="btn" href="/invoices">Back</Link>
          <Link className="btn" href={`/invoices/print?id=${invoice.id}`} target="_blank">Print</Link>
          <a className="btn btn-primary" href={`/api/invoices/${invoice.id}/pdf`}>Download PDF</a>
          <button type="button" className="btn" disabled={driveBusy} onClick={saveToDrive}>
            {driveBusy && <span className="loading loading-spinner loading-sm" aria-hidden="true" />}
            {driveBusy ? "Saving…" : "Save to Drive"}
          </button>
        </div>
      </div>
      <div className="preview-wrap"><InvoicePreview
        company={invoice.company_snapshot}
        address={invoice.address_snapshot}
        customer={invoice.customer_snapshot}
        invoiceNumber={invoice.invoice_number}
        invoiceDate={invoice.invoice_date}
        dueDate={invoice.due_date}
        terms={invoice.terms}
        lines={invoice.items}
        subtotal={Number(invoice.subtotal)}
        discount={Number(invoice.discount)}
        tax={Number(invoice.tax)}
        total={Number(invoice.total)}
        cashPaid={Number(invoice.cash_paid)}
        cardPaid={Number(invoice.card_paid)}
        paymentMade={Number(invoice.payment_made)}
        balanceDue={Number(invoice.balance_due)}
        taxEnabled={invoice.tax_enabled}
      /></div>
    </>
  );
}
