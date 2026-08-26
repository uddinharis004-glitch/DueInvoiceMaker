import { requirePageAuth } from "@/lib/auth";
import { getInvoices } from "@/lib/invoice";
import AppShell from "@/components/AppShell";
import InvoicesClient from "./invoices-client";

export default async function InvoicesPage() {
  await requirePageAuth();
  const invoices = await getInvoices();
  return <AppShell><div className="content"><InvoicesClient initial={JSON.parse(JSON.stringify(invoices))} /></div></AppShell>;
}
