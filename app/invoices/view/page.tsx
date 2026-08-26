import { requirePageAuth } from "@/lib/auth";
import AppShell from "@/components/AppShell";
import InvoiceDetails from "./invoice-details";

export default async function InvoiceViewPage({searchParams}:{searchParams:Promise<{id?:string}>}) {
  await requirePageAuth();
  const {id}=await searchParams;
  if(!id) return <AppShell><div className="content"><div className="card">Missing invoice ID.</div></div></AppShell>;
  return <AppShell><div className="content"><InvoiceDetails id={id}/></div></AppShell>;
}
