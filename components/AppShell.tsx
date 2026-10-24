"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/app/api/auth/logout/actions";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/invoices", label: "Invoices", icon: "invoice" },
  { href: "/invoices/new", label: "New invoice", icon: "add" },
  { href: "/customers", label: "Customers", icon: "customers" },
  { href: "/items", label: "Items", icon: "items" },
  { href: "/company", label: "Company profile", icon: "settings" },
] as const;

function NavigationIcon({ name }: { name: (typeof navigation)[number]["icon"] }) {
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, "aria-hidden": true };

  if (name === "dashboard") return <svg {...common}><path d="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z" /></svg>;
  if (name === "invoice") return <svg {...common}><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 8h6M9 12h6M9 16h3" /></svg>;
  if (name === "add") return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
  if (name === "customers") return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
  if (name === "items") return <svg {...common}><path d="m21 16-4 4-5-5M3 8l4-4 5 5M7 4v12a4 4 0 0 0 4 4h6M17 20V8a4 4 0 0 0-4-4H7" /></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.09A1.7 1.7 0 0 0 9 19.36a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.63 15a1.7 1.7 0 0 0-1.56-1.03H3v-4h.09A1.7 1.7 0 0 0 4.64 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.63a1.7 1.7 0 0 0 1.03-1.56V3h4v.09A1.7 1.7 0 0 0 15 4.64a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.37 9a1.7 1.7 0 0 0 1.56 1.03H21v4h-.09A1.7 1.7 0 0 0 19.4 15Z" /></svg>;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [navigationOpen, setNavigationOpen] = useState(false);

  return (
    <div className="drawer min-h-screen lg:drawer-open">
      <input id="app-navigation" type="checkbox" className="drawer-toggle" checked={navigationOpen} onChange={(event) => setNavigationOpen(event.target.checked)} />

      <div className="drawer-content flex min-w-0 flex-col bg-base-200/60">
        <header className="navbar sticky top-0 z-30 min-h-16 border-b border-base-300 bg-base-100/95 px-3 backdrop-blur-sm sm:px-6 no-print">
          <div className="navbar-start gap-2">
            <label htmlFor="app-navigation" className="btn btn-square btn-ghost lg:hidden" aria-label="Open navigation">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </label>
            <div>
              <strong className="block text-sm sm:text-base">Private Invoice System</strong>
              <span className="hidden text-xs text-base-content/55 sm:block">Invoices, customers and payments</span>
            </div>
          </div>
          <div className="navbar-end">
            <span className="badge badge-soft badge-neutral hidden sm:inline-flex">Single-user</span>
          </div>
        </header>

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <div className="drawer-side z-40 no-print">
        <label htmlFor="app-navigation" aria-label="Close navigation" className="drawer-overlay" />
        <aside className="flex min-h-full w-72 flex-col bg-neutral p-4 text-neutral-content">
          <div className="mb-6 flex items-center gap-3 px-2 pt-2">
            <div className="grid size-11 place-items-center rounded-field bg-primary text-xl font-black text-primary-content">D</div>
            <div>
              <div className="font-bold tracking-tight">Invoice Maker</div>
              <div className="text-xs text-neutral-content/60">Business workspace</div>
            </div>
          </div>

          <nav aria-label="Primary navigation" className="flex-1">
            <ul className="menu w-full gap-1 p-0">
              {navigation.map((item) => {
                const active = item.href === "/invoices"
                  ? pathname === item.href || (pathname.startsWith("/invoices/") && pathname !== "/invoices/new")
                  : pathname === item.href;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={active ? "menu-active font-semibold" : "text-neutral-content/75 hover:text-neutral-content"}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setNavigationOpen(false)}
                    >
                      <NavigationIcon name={item.icon} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <form action={logout} className="border-t border-neutral-content/15 pt-4">
            <button type="submit" className="btn btn-ghost w-full justify-start text-neutral-content/75 hover:text-neutral-content">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M10 17l5-5-5-5M15 12H3M21 19V5a2 2 0 0 0-2-2h-6" /></svg>
              Sign out
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
