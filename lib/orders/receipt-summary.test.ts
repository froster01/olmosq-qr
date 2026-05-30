import assert from "node:assert/strict";
import { test } from "node:test";

import { buildReceiptItemDescription, formatReceiptMoney } from "./receipt-summary";

test("buildReceiptItemDescription omits variant SKU labels and includes modifiers", () => {
  assert.equal(
    buildReceiptItemDescription({
      item: { name: "Matcha Strawberry" },
      variant: { name: "10001" },
      modifiers: [
        { modifier: { name: "Less Ice" } },
        { modifier: { name: "Oat Milk" } },
      ],
    }),
    "Matcha Strawberry + Less Ice, Oat Milk"
  );
});

test("formatReceiptMoney uses RM currency formatting", () => {
  assert.equal(formatReceiptMoney(14), "RM 14.00");
});
