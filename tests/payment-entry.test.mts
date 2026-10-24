import assert from "node:assert/strict";
import test from "node:test";
import { paymentInputValue, paymentValuesForMode } from "../lib/payment-entry.ts";

test("paid in full with cash assigns the total only to cash", () => {
  assert.deepEqual(paymentValuesForMode("cash-full", 125.5), { cash: 125.5, card: 0 });
});

test("paid in full with card assigns the total only to card", () => {
  assert.deepEqual(paymentValuesForMode("card-full", 125.5), { cash: 0, card: 125.5 });
});

test("custom payment starts with empty amounts", () => {
  assert.deepEqual(paymentValuesForMode("custom", 125.5), { cash: 0, card: 0 });
});

test("zero is displayed as an empty payment field so typing replaces it", () => {
  assert.equal(paymentInputValue(0), "");
  assert.equal(paymentInputValue(42.5), "42.5");
});
