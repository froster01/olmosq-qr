import assert from "node:assert/strict";
import test from "node:test";

import { calculateCashChange } from "./cash-change";

test("calculateCashChange returns change when cash received is more than total", () => {
  assert.deepEqual(calculateCashChange({ total: 14, received: 20 }), {
    change: 6,
    remaining: 0,
    isEnough: true,
  });
});

test("calculateCashChange returns remaining amount when cash received is short", () => {
  assert.deepEqual(calculateCashChange({ total: 14, received: 10 }), {
    change: 0,
    remaining: 4,
    isEnough: false,
  });
});

test("calculateCashChange rounds money to two decimals", () => {
  assert.deepEqual(calculateCashChange({ total: 14.1, received: 20 }), {
    change: 5.9,
    remaining: 0,
    isEnough: true,
  });
});
