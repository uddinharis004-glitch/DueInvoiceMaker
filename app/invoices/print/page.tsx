import { requirePageAuth } from "@/lib/auth";
import { getInvoice } from "@/lib/invoice";
import InvoicePreview from "@/components/InvoicePreview";

export default async function PrintPage({searchParams}:{searchParams:Promise<{id?:string}>}) {
  await requirePageAuth();
  const {id}=await searchParams;
  if(!id) return <div>Missing invoice.</div>;
  const invoice:any=await getInvoice(id);
  if(!invoice) return <div>Invoice not found.</div>;
  return <div style={{background:"#fff",minHeight:"100vh"}}>
    <div className="no-print" style={{padding:10,textAlign:"center",fontFamily:"Arial"}}>
      Press <strong>Ctrl+P</strong> (Windows) or <strong>Cmd+P</strong> (Mac) to print.
    </div>
    <InvoicePreview
      company={invoice.company_snapshot}
      address={invoice.address_snapshot}
      customer={invoice.customer_snapshot}
      invoiceNumber={invoice.invoice_number}
      invoiceDate={invoice.invoice_date}
      dueDate={invoice.due_date}
      terms={invoice.terms}
      lines={invoice.items}
      subtotal={Number(invoice.subtotal)}
      discount={Number(invoice.discount)}
      tax={Number(invoice.tax)}
      total={Number(invoice.total)}
      cashPaid={Number(invoice.cash_paid)}
      cardPaid={Number(invoice.card_paid)}
      paymentMade={Number(invoice.payment_made)}
      balanceDue={Number(invoice.balance_due)}
      taxEnabled={invoice.tax_enabled}
    />
  </div>;
}
