import { requirePageAuth } from "@/lib/auth";
import AppShell from "@/components/AppShell";
import ItemsClient from "./items-client";

export default async function ItemsPage() {
  await requirePageAuth();
  return <AppShell><div className="content"><ItemsClient /></div></AppShell>;
}
