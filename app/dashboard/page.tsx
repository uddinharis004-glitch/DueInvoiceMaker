import { requirePageAuth } from "@/lib/auth";
import { query } from "@/lib/db";
import AppShell from "@/components/AppShell";
import Link from "next/link";
import { money } from "@/lib/utils";

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
        <div className="toolbar" style={{ justifyContent: "space-between" }}>
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="muted">Create, print and archive your company invoices.</p>
          </div>
          <Link className="btn primary" href="/invoices/new">+ New Invoice</Link>
        </div>

        <div className="grid grid-4">
          <div className="card"><div className="stat-label">Invoices</div><div className="stat-value">{stats.total_count ?? 0}</div></div>
          <div className="card"><div className="stat-label">Total billed</div><div className="stat-value">{money(stats.billed)}</div></div>
          <div className="card"><div className="stat-label">Paid</div><div className="stat-value">{money(stats.paid)}</div></div>
          <div className="card"><div className="stat-label">Outstanding</div><div className="stat-value">{money(stats.outstanding)}</div></div>
        </div>

        <div className="card" style={{ marginTop: 20 }}>
          <div className="toolbar">
            <h2 style={{ margin: 0 }}>Recent invoices</h2>
            <Link className="btn" href="/invoices">View all</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Invoice</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>
                {recent.rows.map((r: any) => (
                  <tr key={r.invoice_number}>
                    <td><Link href={`/invoices?invoice=${encodeURIComponent(r.invoice_number)}`}><strong>{r.invoice_number}</strong></Link></td>
                    <td>{r.customer_snapshot?.name}</td>
                    <td>{new Date(r.invoice_date).toLocaleDateString()}</td>
                    <td>{money(r.total)}</td>
                    <td><span className={`badge ${String(r.payment_status).toLowerCase()}`}>{r.payment_status}</span></td>
                  </tr>
                ))}
                {!recent.rows.length && <tr><td colSpan={5} className="muted">No invoices yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
