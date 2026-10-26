import assert from "node:assert/strict";
import test from "node:test";
import { filterItemChoices, RECENT_ITEM_LIMIT } from "../lib/item-selection.ts";

const items = [
  { id: "new", name: "Galaxy A16", description: "Smartphone", sku: "PHONE-16" },
  { id: "middle", name: "Device setup", description: "Activation service", sku: "SERVICE-01" },
  { id: "old", name: "Protective case", description: "Black phone case", sku: "CASE-10" },
];

test("keeps recent item order and limits the initial choices", () => {
  const longList = Array.from({ length: 12 }, (_, index) => ({ ...items[index % items.length], id: `item-${index}` }));
  assert.deepEqual(filterItemChoices(longList, "", RECENT_ITEM_LIMIT).map((item) => item.id), Array.from({ length: 10 }, (_, index) => `item-${index}`));
});

test("searches item name, description, and SKU without case sensitivity", () => {
  assert.equal(filterItemChoices(items, "activation", 10)[0]?.id, "middle");
  assert.equal(filterItemChoices(items, "case-10", 10)[0]?.id, "old");
});
