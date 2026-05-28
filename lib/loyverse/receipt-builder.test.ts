import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildReceiptPayment,
  buildReceiptLineItem,
  resolveReceiptVariantId,
} from "./receipt-builder";

test("resolveReceiptVariantId uses the selected variant when present", () => {
  assert.equal(
    resolveReceiptVariantId({
      selectedVariantLoyverseId: "selected-variant",
      itemName: "Latte",
      variants: [{ loyverseId: "default-variant" }],
    }),
    "selected-variant"
  );
});

test("resolveReceiptVariantId falls back to the item's first synced variant", () => {
  assert.equal(
    resolveReceiptVariantId({
      selectedVariantLoyverseId: undefined,
      itemName: "Latte",
      variants: [{ loyverseId: "default-variant" }],
    }),
    "default-variant"
  );
});

test("buildReceiptLineItem uses Loyverse receipt field names", () => {
  assert.deepEqual(
    buildReceiptLineItem({
      itemName: "Latte",
      quantity: 2,
      selectedVariantLoyverseId: undefined,
      variants: [{ loyverseId: "default-variant" }],
      modifiers: [{ loyverseId: "modifier-option" }],
    }),
    {
      variant_id: "default-variant",
      quantity: 2,
      line_modifiers: [{ modifier_option_id: "modifier-option" }],
    }
  );
});

test("buildReceiptPayment sends the Loyverse payment type UUID", () => {
  assert.deepEqual(
    buildReceiptPayment({
      paymentType: {
        id: "local-payment-type-id",
        loyverseId: "60450c3a-515b-4e5f-a8e5-80be0ffaa88e",
      },
      amount: 14,
    }),
    {
      payment_type_id: "60450c3a-515b-4e5f-a8e5-80be0ffaa88e",
      amount: 14,
    }
  );
});
