import assert from "node:assert/strict";
import test from "node:test";
import { getPagination, getVisiblePages } from "../lib/pagination.ts";

test("uses the first page and eight customers by default", () => {
  assert.deepEqual(getPagination(new URLSearchParams()), {
    page: 1,
    pageSize: 8,
    offset: 0,
  });
});

test("calculates the offset for later pages", () => {
  assert.deepEqual(getPagination(new URLSearchParams("page=3&limit=8")), {
    page: 3,
    pageSize: 8,
    offset: 16,
  });
});

test("rejects invalid page values and caps the page size", () => {
  assert.deepEqual(getPagination(new URLSearchParams("page=-2&limit=500")), {
    page: 1,
    pageSize: 50,
    offset: 0,
  });
});

test("shows a compact five-page window around the current page", () => {
  assert.deepEqual(getVisiblePages(6, 12), [4, 5, 6, 7, 8]);
  assert.deepEqual(getVisiblePages(1, 3), [1, 2, 3]);
});
