import assert from "node:assert/strict";
import { test } from "node:test";

import {
  calculateCashVariance,
  canCloseShift,
  formatOrderDisplayNumber,
  getNextShiftNumber,
  getShiftOrderAssignment,
  validateShiftCashAmount,
} from "./shift-rules";

test("formatOrderDisplayNumber pads shift order numbers", () => {
  assert.equal(
    formatOrderDisplayNumber({ shiftOrderNumber: 1, orderNumber: 42 }),
    "#0001"
  );
  assert.equal(
    formatOrderDisplayNumber({ shiftOrderNumber: 27, orderNumber: 42 }),
    "#0027"
  );
});

test("formatOrderDisplayNumber falls back to legacy global order numbers", () => {
  assert.equal(
    formatOrderDisplayNumber({ shiftOrderNumber: null, orderNumber: 42 }),
    "#42"
  );
});

test("getNextShiftNumber increments from the latest known shift", () => {
  assert.equal(getNextShiftNumber([]), 1);
  assert.equal(getNextShiftNumber([{ shiftNumber: 1 }, { shiftNumber: 4 }]), 5);
});

test("getShiftOrderAssignment starts at 0001 and increments the next counter", () => {
  assert.deepEqual(getShiftOrderAssignment({ nextOrderNumber: 1 }), {
    shiftOrderNumber: 1,
    nextOrderNumber: 2,
  });
});

test("canCloseShift allows closing when every order is final", () => {
  assert.equal(canCloseShift([]), true);
  assert.equal(
    canCloseShift([{ status: "DONE" }, { status: "CANCELLED" }]),
    true
  );
  assert.equal(
    canCloseShift([{ status: "DONE" }, { status: "AWAITING_PAYMENT" }]),
    false
  );
});

test("validateShiftCashAmount requires a non-negative finite amount", () => {
  assert.equal(validateShiftCashAmount(0), 0);
  assert.equal(validateShiftCashAmount(12.345), 12.35);

  assert.throws(() => validateShiftCashAmount(-1), /cannot be negative/);
  assert.throws(() => validateShiftCashAmount(Number.NaN), /valid cash amount/);
});

test("calculateCashVariance compares actual cash to expected cash", () => {
  assert.equal(calculateCashVariance({ expectedCash: 151.5, actualCash: 150 }), -1.5);
  assert.equal(calculateCashVariance({ expectedCash: 151.5, actualCash: 160 }), 8.5);
});
