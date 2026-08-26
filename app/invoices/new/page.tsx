import { requirePageAuth } from "@/lib/auth";
import { getAddresses, getCompany, getCustomers, getItems, getTaxRates } from "@/lib/invoice";
import AppShell from "@/components/AppShell";
import InvoiceForm from "@/components/InvoiceForm";

export default async function NewInvoicePage() {
  await requirePageAuth();
  const [company,addresses,customers,items,taxRates]=await Promise.all([getCompany(),getAddresses(),getCustomers(),getItems(),getTaxRates()]);
  return <AppShell><div className="content"><InvoiceForm company={company} addresses={addresses} customers={customers} items={items} taxRates={taxRates} /></div></AppShell>;
}
