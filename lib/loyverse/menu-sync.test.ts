import assert from "node:assert/strict";
import test from "node:test";

import {
  getLoyverseVariantMenuPrice,
  isLoyverseVariantAvailableForStore,
} from "./menu-sync";
import type { LoyverseItemVariant } from "./types";

function variant(
  overrides: Partial<LoyverseItemVariant> = {}
): LoyverseItemVariant {
  return {
    variant_id: "variant-1",
    item_id: "item-1",
    sku: "10015",
    default_price: 10,
    stores: [
      {
        store_id: "store-1",
        pricing_type: "FIXED",
        price: 8,
        available_for_sale: true,
      },
    ],
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

test("getLoyverseVariantMenuPrice prefers the configured store price", () => {
  assert.equal(getLoyverseVariantMenuPrice(variant(), "store-1"), 8);
});

test("getLoyverseVariantMenuPrice falls back to default price without a store override", () => {
  assert.equal(getLoyverseVariantMenuPrice(variant(), "store-2"), 10);
});

test("isLoyverseVariantAvailableForStore follows the configured store availability", () => {
  assert.equal(
    isLoyverseVariantAvailableForStore(
      variant({
        stores: [
          {
            store_id: "store-1",
            pricing_type: "FIXED",
            price: 8,
            available_for_sale: false,
          },
        ],
      }),
      "store-1"
    ),
    false
  );
});
