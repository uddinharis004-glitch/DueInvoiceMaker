import { requirePageAuth } from "@/lib/auth";
import AppShell from "@/components/AppShell";
import CompanyClient from "./company-client";

export default async function CompanyPage() {
  await requirePageAuth();
  return <AppShell><div className="content"><CompanyClient /></div></AppShell>;
}
