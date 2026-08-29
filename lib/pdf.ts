import PDFDocument from "pdfkit";
import { formatInvoiceDate, money } from "./utils";

const LEFT = 46;
const RIGHT = 566;

function text(value: unknown) {
  return String(value ?? "");
}

function number(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function addLogo(doc: PDFKit.PDFDocument, logoData: unknown) {
  if (typeof logoData !== "string" || !logoData.startsWith("data:image/")) return false;
  try {
    const encoded = logoData.split(",", 2)[1];
    if (!encoded) return false;
    doc.image(Buffer.from(encoded, "base64"), LEFT, 42, { fit: [175, 62], valign: "center" });
    return true;
  } catch (error) {
    console.warn("Invoice logo could not be rendered in the PDF", error);
    return false;
  }
}

function tableHeader(doc: PDFKit.PDFDocument, y: number) {
  doc.rect(LEFT, y, RIGHT - LEFT, 25).fill("#3f3f3f");
  doc.fillColor("white").font("Helvetica-Bold").fontSize(9);
  doc.text("#", LEFT + 8, y + 8, { width: 24 });
  doc.text("Description", LEFT + 38, y + 8, { width: 260 });
  doc.text("Qty", 360, y + 8, { width: 45, align: "right" });
  doc.text("Rate", 415, y + 8, { width: 60, align: "right" });
  doc.text("Amount", 485, y + 8, { width: 73, align: "right" });
  return y + 25;
}

function totalRow(doc: PDFKit.PDFDocument, label: string, value: unknown, y: number, options: { bold?: boolean; fill?: string; color?: string } = {}) {
  if (options.fill) doc.rect(355, y, 211, 23).fill(options.fill);
  doc.fillColor(options.color ?? "#1f1f1f").font(options.bold ? "Helvetica-Bold" : "Helvetica").fontSize(9);
  doc.text(label, 365, y + 7, { width: 115 });
  doc.text(money(value), 485, y + 7, { width: 71, align: "right" });
  return y + 23;
}

export async function renderInvoicePdf(invoice: any) {
  const doc = new PDFDocument({ size: "LETTER", margin: LEFT, compress: true, info: { Title: text(invoice.invoice_number), Author: text(invoice.company_snapshot?.name) } });
  const chunks: Buffer[] = [];
  const completed = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const company = invoice.company_snapshot ?? {};
  const address = invoice.address_snapshot ?? {};
  const customer = invoice.customer_snapshot ?? {};
  const lines = Array.isArray(invoice.items) ? invoice.items : [];
  const hasLogo = addLogo(doc, company.logo_data);
  let companyY = hasLogo ? 112 : 48;

  doc.fillColor("#1f1f1f").font("Helvetica-Bold").fontSize(15).text(text(company.name), LEFT, companyY, { width: 260 });
  companyY = doc.y + 3;
  doc.font("Helvetica").fontSize(9);
  [address.street, [address.city, address.state, address.zip].filter(Boolean).join(" "), address.phone || company.phone, company.email, company.website]
    .filter(Boolean)
    .forEach((line) => { doc.text(text(line), LEFT, companyY, { width: 270 }); companyY = doc.y + 1; });

  doc.font("Helvetica").fontSize(28).text("INVOICE", 345, 45, { width: 220, align: "right" });
  doc.font("Helvetica-Bold").fontSize(11).text(text(invoice.invoice_number), 345, 80, { width: 220, align: "right" });
  doc.fontSize(9).text("Balance Due", 345, 112, { width: 220, align: "right" });
  doc.fontSize(16).text(money(invoice.balance_due), 345, 126, { width: 220, align: "right" });
  doc.font("Helvetica").fontSize(9);
  doc.text(`Invoice Date:  ${formatInvoiceDate(invoice.invoice_date)}`, 385, 162, { width: 180, align: "right" });
  doc.text(`Due Date:  ${invoice.due_date ? formatInvoiceDate(invoice.due_date) : formatInvoiceDate(invoice.invoice_date)}`, 385, 178, { width: 180, align: "right" });

  const customerAddress = [customer.street, [customer.city, customer.state, customer.zip].filter(Boolean).join(" "), customer.phone].filter(Boolean);
  doc.font("Helvetica-Bold").fontSize(10).text(text(customer.name), LEFT, 205, { width: 300 });
  let customerY = doc.y + 2;
  doc.font("Helvetica").fontSize(9);
  if (customer.company_name) { doc.text(text(customer.company_name), LEFT, customerY, { width: 300 }); customerY = doc.y + 1; }
  customerAddress.forEach((line) => { doc.text(text(line), LEFT, customerY, { width: 300 }); customerY = doc.y + 1; });

  let y = tableHeader(doc, Math.max(275, customerY + 18));
  lines.forEach((line: any, index: number) => {
    const description = [text(line.name), text(line.description)].filter(Boolean).join("\n");
    const rowHeight = Math.max(30, doc.heightOfString(description, { width: 255 }) + 12);
    if (y + rowHeight > 650) { doc.addPage(); y = tableHeader(doc, 46); }
    doc.fillColor("#1f1f1f").font("Helvetica").fontSize(9);
    doc.text(String(index + 1), LEFT + 8, y + 7, { width: 24 });
    doc.font("Helvetica-Bold").text(text(line.name), LEFT + 38, y + 7, { width: 255 });
    if (line.description) doc.font("Helvetica").fillColor("#666666").fontSize(8).text(text(line.description), LEFT + 38, doc.y + 2, { width: 255 });
    doc.fillColor("#1f1f1f").font("Helvetica").fontSize(9);
    doc.text(number(line.qty).toFixed(2), 360, y + 7, { width: 45, align: "right" });
    doc.text(money(line.rate), 415, y + 7, { width: 60, align: "right" });
    doc.text(money(line.amount ?? line.net), 485, y + 7, { width: 73, align: "right" });
    y += rowHeight;
    doc.moveTo(LEFT, y).lineTo(RIGHT, y).strokeColor("#dddddd").lineWidth(0.5).stroke();
  });

  if (y > 590) { doc.addPage(); y = 46; }
  y += 10;
  y = totalRow(doc, "Sub Total", invoice.subtotal, y);
  if (number(invoice.discount) > 0) y = totalRow(doc, "Discount (-)", invoice.discount, y);
  if (invoice.tax_enabled && number(invoice.tax) > 0) y = totalRow(doc, "Tax", invoice.tax, y);
  y = totalRow(doc, "Total", invoice.total, y, { bold: true });
  if (number(invoice.cash_paid) > 0) y = totalRow(doc, "Cash Payment (-)", invoice.cash_paid, y, { color: "#d64545" });
  if (number(invoice.card_paid) > 0) y = totalRow(doc, "Card Payment (-)", invoice.card_paid, y, { color: "#d64545" });
  if (number(invoice.payment_made) > 0 && number(invoice.cash_paid) <= 0 && number(invoice.card_paid) <= 0) y = totalRow(doc, "Payment Made (-)", invoice.payment_made, y, { color: "#d64545" });
  y = totalRow(doc, "Balance Due", invoice.balance_due, y, { bold: true, fill: "#f1f1ef" });

  let footerY = y + 50;
  if (footerY > 730) { doc.addPage(); footerY = LEFT; }
  doc.fillColor("#1f1f1f").font("Helvetica").fontSize(9).text("Thanks for your business.", LEFT, footerY);
  if (invoice.terms) {
    const terms = text(invoice.terms);
    const termsOptions = { width: RIGHT - LEFT, lineGap: 2 };
    const termsHeight = doc.font("Helvetica").fontSize(8).heightOfString(terms, termsOptions);
    let termsY = footerY + 40;
    if (termsY + 18 + termsHeight > 746) { doc.addPage(); termsY = LEFT; }
    doc.fillColor("#1f1f1f").font("Helvetica-Bold").fontSize(9).text("Terms & Conditions", LEFT, termsY);
    doc.font("Helvetica").fontSize(8).text(terms, LEFT, termsY + 16, termsOptions);
  }

  doc.end();
  return completed;
}
