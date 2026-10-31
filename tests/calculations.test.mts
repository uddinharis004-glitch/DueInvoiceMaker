import assert from "node:assert/strict";
import test from "node:test";
import { calculateInvoice, invoiceLineAmount } from "../lib/calculations.ts";

test("keeps tax out of item line amounts and adds it to the invoice total", () => {
  const invoice = calculateInvoice([
    {
      id: "phone",
      name: "Phone",
      description: "",
      qty: 2,
      rate: 50,
      discountType: "percent",
      discountValue: 0,
      taxable: true,
    },
  ], true, 10);

  assert.equal(invoice.lines[0]?.amount, 100);
  assert.equal(invoice.tax, 10);
  assert.equal(invoice.total, 110);
});

test("uses the pre-tax net amount when rendering a previously saved line", () => {
  assert.equal(invoiceLineAmount({ net: 185, amount: 203.96 }), 185);
});

test("falls back to the stored amount for legacy lines without a net value", () => {
  assert.equal(invoiceLineAmount({ amount: 185 }), 185);
});
