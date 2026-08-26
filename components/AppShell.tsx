import Link from "next/link";
import { logout } from "@/app/api/auth/logout/actions";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <aside className="sidebar no-print">
        <div className="brand">Invoice Maker</div>
        <nav className="nav">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/invoices">Invoices</Link>
          <Link href="/invoices/new">New Invoice</Link>
          <Link href="/customers">Customers</Link>
          <Link href="/items">Items</Link>
          <Link href="/company">Company Profile</Link>
        </nav>
        <form action={logout} style={{ marginTop: 24 }}>
          <button className="btn" style={{ width: "100%" }}>Logout</button>
        </form>
      </aside>
      <main className="main">
        <header className="topbar no-print">
          <strong>Private Invoice System</strong>
          <span className="muted">Single-user</span>
        </header>
        {children}
      </main>
    </div>
  );
}
