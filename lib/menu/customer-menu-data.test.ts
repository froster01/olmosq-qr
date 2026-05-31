import assert from "node:assert/strict";
import test from "node:test";

import { serializeCustomerMenuCategories } from "./customer-menu-data";

const date = new Date("2026-01-02T03:04:05.000Z");

function category(overrides: Record<string, unknown> = {}) {
  return {
    id: "cat-1",
    loyverseId: "loyverse-cat-1",
    name: "Coffee",
    imageUrl: null,
    sortOrder: 1,
    asksTemperature: true,
    isVisibleInMenu: true,
    createdAt: date,
    updatedAt: date,
    items: [
      {
        id: "item-1",
        loyverseId: "loyverse-item-1",
        name: "Latte",
        description: "Milk coffee",
        basePrice: "12.50",
        categoryId: "cat-1",
        imageUrl: null,
        isAvailable: true,
        createdAt: date,
        updatedAt: date,
        variants: [
          {
            id: "variant-1",
            loyverseId: "loyverse-variant-1",
            itemId: "item-1",
            name: "Regular",
            priceAdjustment: "1.25",
            sortOrder: 1,
            createdAt: date,
            updatedAt: date,
          },
        ],
        modifiers: [
          {
            id: "modifier-1",
            loyverseId: "loyverse-modifier-1",
            itemId: "item-1",
            name: "Oat milk",
            priceAdjustment: "2.00",
            createdAt: date,
            updatedAt: date,
          },
        ],
      },
    ],
    ...overrides,
  };
}

test("serializeCustomerMenuCategories filters invisible and empty categories", () => {
  const serialized = serializeCustomerMenuCategories([
    category({ id: "visible", name: "Visible" }),
    category({ id: "hidden", name: "Hidden", isVisibleInMenu: false }),
    category({ id: "empty", name: "Empty", items: [] }),
  ]);

  assert.deepEqual(
    serialized.map((cat) => cat.id),
    ["visible"]
  );
});

test("serializeCustomerMenuCategories keeps only available items", () => {
  const serialized = serializeCustomerMenuCategories([
    category({
      items: [
        {
          ...category().items[0],
          id: "available",
          isAvailable: true,
        },
        {
          ...category().items[0],
          id: "unavailable",
          isAvailable: false,
        },
      ],
    }),
  ]);

  assert.deepEqual(
    serialized[0]?.items.map((item) => item.id),
    ["available"]
  );
});

test("serializeCustomerMenuCategories converts money and dates to primitives", () => {
  const [serialized] = serializeCustomerMenuCategories([category()]);

  assert.equal(serialized.items[0].basePrice, 12.5);
  assert.equal(serialized.items[0].variants[0].priceAdjustment, 1.25);
  assert.equal(serialized.items[0].modifiers[0].priceAdjustment, 2);
  assert.equal(serialized.createdAt, "2026-01-02T03:04:05.000Z");
  assert.equal(serialized.items[0].createdAt, "2026-01-02T03:04:05.000Z");
});
