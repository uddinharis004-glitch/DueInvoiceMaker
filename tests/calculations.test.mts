import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateInvoice,
  invoiceLineAmount,
  invoiceLineTax,
} from "../lib/calculations.ts";

test("adds tax to each item amount and the invoice total", () => {
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

  assert.equal(invoice.lines[0]?.taxAmount, 10);
  assert.equal(invoice.lines[0]?.amount, 110);
  assert.equal(invoice.tax, 10);
  assert.equal(invoice.total, 110);
});

test("renders saved line tax and tax-inclusive amount from line values", () => {
  const line = { net: 185, taxAmount: 18.96, amount: 185 };

  assert.equal(invoiceLineTax(line), 18.96);
  assert.equal(invoiceLineAmount(line), 203.96);
});

test("falls back to the stored amount when line tax details are unavailable", () => {
  assert.equal(invoiceLineTax({ amount: 185 }), 0);
  assert.equal(invoiceLineAmount({ amount: 185 }), 185);
});

test("totals the rounded tax shown on individual item lines", () => {
  const lines = ["first", "second"].map((id) => ({
    id,
    name: id,
    description: "",
    qty: 1,
    rate: 0.05,
    discountType: "fixed" as const,
    discountValue: 0,
    taxable: true,
  }));

  const invoice = calculateInvoice(lines, true, 10);

  assert.deepEqual(invoice.lines.map((line) => line.taxAmount), [0.01, 0.01]);
  assert.equal(invoice.tax, 0.02);
  assert.equal(invoice.total, 0.12);
});
