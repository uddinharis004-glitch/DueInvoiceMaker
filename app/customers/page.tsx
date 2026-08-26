import { requirePageAuth } from "@/lib/auth";
import AppShell from "@/components/AppShell";
import CustomersClient from "./customers-client";

export default async function CustomersPage() {
  await requirePageAuth();
  return <AppShell><div className="content"><CustomersClient /></div></AppShell>;
}
