import assert from "node:assert/strict";
import { test } from "node:test";

import { buildReceiptItemDescription, formatReceiptMoney } from "./receipt-summary";

test("buildReceiptItemDescription includes named variant and modifiers", () => {
  assert.equal(
    buildReceiptItemDescription({
      item: { name: "Matcha Strawberry" },
      variant: { name: "10001" },
      modifiers: [
        { modifier: { name: "Less Ice" } },
        { modifier: { name: "Oat Milk" } },
      ],
    }),
    "Matcha Strawberry (Large) + Less Ice, Oat Milk"
  );
});

test("buildReceiptItemDescription omits SKU-like variant labels", () => {
  assert.equal(
    buildReceiptItemDescription({
      item: { name: "Chocolate Caramel" },
      variant: { name: "10015" },
      modifiers: [],
    }),
    "Chocolate Caramel"
  );
});

test("buildReceiptItemDescription omits SKU-like variant labels", () => {
  assert.equal(
    buildReceiptItemDescription({
      item: { name: "Chocolate Caramel" },
      variant: { name: "10015" },
      modifiers: [],
    }),
    "Chocolate Caramel"
  );
});

test("formatReceiptMoney uses RM currency formatting", () => {
  assert.equal(formatReceiptMoney(14), "RM 14.00");
});
