import assert from "node:assert/strict";
import { test } from "node:test";

import {
  canCloseShift,
  formatOrderDisplayNumber,
  getNextShiftNumber,
  getShiftOrderAssignment,
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

test("canCloseShift allows closing only when the shift has no orders", () => {
  assert.equal(canCloseShift([]), true);
  assert.equal(
    canCloseShift([{ status: "DONE" }, { status: "CANCELLED" }]),
    false
  );
  assert.equal(
    canCloseShift([{ status: "DONE" }, { status: "AWAITING_PAYMENT" }]),
    false
  );
});
