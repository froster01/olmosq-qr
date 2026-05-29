import assert from "node:assert/strict";
import test from "node:test";

import { moveCategoryInOrder } from "./category-sort";

test("moveCategoryInOrder swaps a category with the previous category", () => {
  assert.deepEqual(
    moveCategoryInOrder(
      [{ id: "add-on" }, { id: "food" }, { id: "coffee" }],
      "food",
      "up"
    ).map((category) => category.id),
    ["food", "add-on", "coffee"]
  );
});

test("moveCategoryInOrder leaves edge categories in place", () => {
  assert.deepEqual(
    moveCategoryInOrder(
      [{ id: "add-on" }, { id: "food" }, { id: "coffee" }],
      "add-on",
      "up"
    ).map((category) => category.id),
    ["add-on", "food", "coffee"]
  );
});
