import { requirePageAuth } from "@/lib/auth";
import AppShell from "@/components/AppShell";
import InvoiceDetails from "./invoice-details";

export default async function InvoiceViewPage({searchParams}:{searchParams:Promise<{id?:string;created?:string}>}) {
  await requirePageAuth();
  const {id,created}=await searchParams;
  if(!id) return <AppShell><div className="content"><div className="card">Missing invoice ID.</div></div></AppShell>;
  return <AppShell><div className="content"><InvoiceDetails id={id} created={created==="1"}/></div></AppShell>;
}
