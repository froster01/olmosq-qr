import assert from "node:assert/strict";
import test from "node:test";

import { getUniqueOrderItemIds, hasAllRequestedItems } from "./submit-order-validation";

test("getUniqueOrderItemIds keeps one id per menu item", () => {
  assert.deepEqual(
    getUniqueOrderItemIds([
      { itemId: "item-1" },
      { itemId: "item-1" },
      { itemId: "item-2" },
    ]),
    ["item-1", "item-2"]
  );
});

test("hasAllRequestedItems accepts duplicate cart rows for an existing item", () => {
  assert.equal(
    hasAllRequestedItems({
      requestedItemIds: ["item-1", "item-1"],
      foundItemIds: ["item-1"],
    }),
    true
  );
});
