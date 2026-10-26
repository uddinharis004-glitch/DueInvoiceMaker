import assert from "node:assert/strict";
import test from "node:test";
import { filterCustomerChoices, RECENT_CUSTOMER_LIMIT } from "../lib/customer-selection.ts";

const customers = [
  { id: "new", name: "Avery Brooks", company_name: "North Star", phone: "555-0101", email: "avery@example.com" },
  { id: "middle", name: "Jordan Lee", company_name: "Lakeview", phone: "555-0102", email: "jordan@example.com" },
  { id: "old", name: "Morgan Chen", company_name: "Sunrise Market", phone: "555-0103", email: "morgan@example.com" },
];

test("keeps recent customer order and limits the initial choices", () => {
  const longList = [...customers, ...customers.map((customer) => ({ ...customer, id: `${customer.id}-older` }))];
  assert.deepEqual(filterCustomerChoices(longList, "", RECENT_CUSTOMER_LIMIT).map((customer) => customer.id), ["new", "middle", "old", "new-older"]);
});

test("searches customer name, company, email, and phone without case sensitivity", () => {
  assert.equal(filterCustomerChoices(customers, "SUNRISE", 8)[0]?.id, "old");
  assert.equal(filterCustomerChoices(customers, "555-0102", 8)[0]?.id, "middle");
});
