import { money, formatInvoiceDate } from "@/lib/utils";

function esc(value: unknown) {
  return String(value ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}

export function invoiceHtml(invoice:any) {
  const company=invoice.company_snapshot;
  const address=invoice.address_snapshot;
  const customer=invoice.customer_snapshot;
  const lines=Array.isArray(invoice.items)?invoice.items:[];
  const taxEnabled=!!invoice.tax_enabled;

  const rows=lines.map((l:any,i:number)=>`
    <tr>
      <td>${i+1}</td>
      <td><div class="item-name">${esc(l.name)}</div><div class="item-desc">${esc(l.description).replaceAll("\n","<br>")}</div></td>
      <td class="num">${Number(l.qty).toFixed(2)}</td>
      <td class="num">${money(l.rate)}</td>
      <td class="num">${money(l.amount ?? l.net)}</td>
    </tr>`).join("");

  const billAddress = [
    customer.street,
    `${customer.city ?? ""}${customer.city && customer.state ? ", " : ""}${customer.state ?? ""} ${customer.zip ?? ""}`.trim(),
    customer.phone
  ].filter(Boolean).map(esc).join("<br>");

  return `<!doctype html>
<html><head><meta charset="utf-8"/><style>
*{box-sizing:border-box}
@page{size:Letter;margin:0}
html,body{margin:0;padding:0;background:#fff}
body{font-family:Arial,Helvetica,sans-serif;color:#1f1f1f}
.page{width:8.5in;min-height:11in;padding:.55in .65in .5in;background:#fff}
.header{display:grid;grid-template-columns:1fr 1fr;min-height:210px}
.company{padding-top:8px}.logo{max-width:190px;max-height:75px;object-fit:contain;object-position:left center;margin-bottom:10px}
.company-name{font-size:17px;font-weight:700}.company-line{font-size:11px;line-height:1.45}
.meta{text-align:right}.title{font-size:31px;font-weight:400;letter-spacing:.02em}.number{font-weight:700;margin-top:2px}
.balance-label{margin-top:22px;font-size:10px;font-weight:700}.balance{font-size:17px;font-weight:800}
.dates{margin-top:86px;font-size:10px;line-height:1.8}.dates span{display:inline-block;min-width:105px}
.bill{font-size:12px;font-weight:700;margin-bottom:16px;line-height:1.45}
table{width:100%;border-collapse:collapse;font-size:10px}.thead{background:#3f3f3f;color:#fff}
th{color:#fff;text-align:left;font-size:10px;font-weight:700;padding:8px 10px}td{padding:8px 10px;vertical-align:top}
.num{text-align:right;white-space:nowrap}.item-name{font-weight:700}.item-desc{color:#777;margin-top:2px;line-height:1.45}
.rule{border-top:1px solid #999;margin-top:8px}.totals{width:43%;margin-left:auto;font-size:10px}
.total{display:flex;justify-content:space-between;padding:7px 10px}.strong{font-weight:800}.payment{color:#e25555}.due{background:#f1f1ef}
.thanks{margin-top:65px;font-size:10px}.terms{margin-top:38px;font-size:9px;line-height:1.45}.terms h4{margin:0 0 6px;font-size:10px}
</style></head><body><div class="page">
<div class="header">
<div class="company">
${company.logo_data?`<img class="logo" src="${company.logo_data}" />`:""}
<div class="company-name">${esc(company.name)}</div>
<div class="company-line">${esc(address.street)}</div>
<div class="company-line">${esc(address.city)}, ${esc(address.state)} ${esc(address.zip)}</div>
${address.phone||company.phone?`<div class="company-line">${esc(address.phone||company.phone)}</div>`:""}
${company.email?`<div class="company-line">${esc(company.email)}</div>`:""}
${company.website?`<div class="company-line">${esc(company.website)}</div>`:""}
</div>
<div class="meta">
<div class="title">INVOICE</div>
<div class="number">${esc(invoice.invoice_number)}</div>
<div class="balance-label">Balance Due</div>
<div class="balance">${money(invoice.balance_due)}</div>
<div class="dates">
<div><span>Invoice Date :</span> ${formatInvoiceDate(invoice.invoice_date)}</div>
<div><span>Terms :</span> ${esc(invoice.terms).split("\n")[0] || "Due on Receipt"}</div>
<div><span>Due Date :</span> ${invoice.due_date?formatInvoiceDate(invoice.due_date):formatInvoiceDate(invoice.invoice_date)}</div>
</div>
</div>
</div>
<div class="bill">${esc(customer.name)}${customer.company_name?`<br><span style="font-weight:400">${esc(customer.company_name)}</span>`:""}${billAddress?`<br><span style="font-weight:400">${billAddress}</span>`:""}</div>
<table><thead class="thead"><tr><th style="width:6%">#</th><th>Description</th><th style="width:12%">Qty</th><th style="width:14%">Rate</th><th style="width:16%">Amount</th></tr></thead>
<tbody>${rows}</tbody></table>
<div class="rule"></div>
<div class="totals">
<div class="total"><span>Sub Total</span><span>${money(invoice.subtotal)}</span></div>
${Number(invoice.discount)>0?`<div class="total"><span>Discount (-)</span><span>${money(invoice.discount)}</span></div>`:""}
${taxEnabled&&Number(invoice.tax)>0?`<div class="total"><span>Tax</span><span>${money(invoice.tax)}</span></div>`:""}
<div class="total strong"><span>Total</span><span>${money(invoice.total)}</span></div>
${Number(invoice.payment_made)>0?`<div class="total payment"><span>Payment Made (-)</span><span>${money(invoice.payment_made)}</span></div>`:""}
<div class="total strong due"><span>Balance Due</span><span>${money(invoice.balance_due)}</span></div>
</div>
<div class="thanks">Thanks for your business.</div>
<div class="terms"><h4>Terms &amp; Conditions</h4><div>${esc(invoice.terms).replaceAll("\n","<br>")}</div></div>
</div></body></html>`;
}
