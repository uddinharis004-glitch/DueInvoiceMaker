import assert from "node:assert/strict";
import test from "node:test";
import { mapGeoapifyResults } from "../lib/address-autocomplete.ts";

test("maps a Geoapify result into the customer address fields", () => {
  const suggestions = mapGeoapifyResults({
    results: [{
      place_id: "place-1",
      formatted: "1600 Pennsylvania Avenue Northwest, Washington, DC 20500, United States",
      address_line1: "1600 Pennsylvania Avenue Northwest",
      city: "Washington",
      state: "District of Columbia",
      state_code: "DC",
      postcode: "20500",
    }],
  });

  assert.deepEqual(suggestions, [{
    id: "place-1",
    label: "1600 Pennsylvania Avenue Northwest, Washington, DC 20500, United States",
    street: "1600 Pennsylvania Avenue Northwest",
    city: "Washington",
    state: "DC",
    zip: "20500",
  }]);
});

test("builds a street line and drops results without a display label", () => {
  const suggestions = mapGeoapifyResults({
    results: [
      { formatted: "10 Main Street, Evanston, IL", housenumber: "10", street: "Main Street", city: "Evanston", state: "Illinois", postcode: "60201" },
      { city: "Missing label" },
    ],
  });

  assert.equal(suggestions.length, 1);
  assert.equal(suggestions[0].street, "10 Main Street");
  assert.equal(suggestions[0].state, "Illinois");
});
