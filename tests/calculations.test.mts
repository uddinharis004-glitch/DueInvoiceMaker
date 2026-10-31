import assert from "node:assert/strict";
import test from "node:test";
import { calculateInvoice } from "../lib/calculations.ts";

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
