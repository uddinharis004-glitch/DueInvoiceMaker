import { requirePageAuth } from "@/lib/auth";
import { query } from "@/lib/db";
import AppShell from "@/components/AppShell";
import Link from "next/link";
import { formatShortDate, money } from "@/lib/utils";
import StatusBadge from "@/components/StatusBadge";

export default async function DashboardPage() {
  await requirePageAuth();

  const { rows } = await query(
    `SELECT
      COUNT(*)::int AS total_count,
      COALESCE(SUM(total),0) AS billed,
      COALESCE(SUM(CASE WHEN payment_status='PAID' THEN total ELSE 0 END),0) AS paid,
      COALESCE(SUM(CASE WHEN balance_due > 0 THEN balance_due ELSE 0 END),0) AS outstanding,
      COUNT(*) FILTER (WHERE payment_status='OVERDUE')::int AS overdue_count
     FROM invoices`,
  );

  const stats = rows[0] ?? {};
  const recent = await query(
    `SELECT invoice_number, invoice_date, total, balance_due, payment_status, customer_snapshot
     FROM invoices ORDER BY created_at DESC LIMIT 8`,
  );

  return (
    <AppShell>
      <div className="content">
        <div className="toolbar justify-between">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="muted">Create, print and archive your company invoices.</p>
          </div>
          <Link className="btn btn-primary" href="/invoices/new">
            <span aria-hidden="true">+</span> New invoice
          </Link>
        </div>

        <div className="grid grid-4">
          <div className="card"><div className="stat-label">Invoices</div><div className="stat-value">{stats.total_count ?? 0}</div></div>
          <div className="card"><div className="stat-label">Total billed</div><div className="stat-value">{money(stats.billed)}</div></div>
          <div className="card"><div className="stat-label">Paid</div><div className="stat-value">{money(stats.paid)}</div></div>
          <div className="card"><div className="stat-label">Outstanding</div><div className="stat-value">{money(stats.outstanding)}</div></div>
        </div>

        <section className="card mt-5" aria-labelledby="recent-invoices-heading">
          <div className="toolbar">
            <h2 id="recent-invoices-heading" className="m-0 text-lg font-bold">Recent invoices</h2>
            <Link className="btn btn-sm" href="/invoices">View all</Link>
          </div>
          <div className="table-wrap">
            <table className="table responsive-table">
              <thead><tr><th>Invoice</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>
                {recent.rows.map((r: any) => (
                  <tr key={r.invoice_number}>
                    <td data-label="Invoice"><Link className="link link-hover font-semibold" href={`/invoices?invoice=${encodeURIComponent(r.invoice_number)}`}>{r.invoice_number}</Link></td>
                    <td data-label="Customer">{r.customer_snapshot?.name}</td>
                    <td data-label="Date">{formatShortDate(r.invoice_date)}</td>
                    <td data-label="Total" className="font-semibold">{money(r.total)}</td>
                    <td data-label="Status"><StatusBadge status={String(r.payment_status)} /></td>
                  </tr>
                ))}
                {!recent.rows.length && <tr><td colSpan={5} className="muted">No invoices yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
