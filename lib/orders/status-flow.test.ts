import assert from "node:assert/strict";
import { test } from "node:test";

import {
  getCheckoutOrderStatus,
  getPaidOrderStatus,
  getReceiptSyncFailedOrderStatus,
  getStaffStatusActions,
} from "./status-flow";

test("customer checkout creates an awaiting-payment order", () => {
  assert.equal(getCheckoutOrderStatus(), "AWAITING_PAYMENT");
});

test("successful payment sends the order to preparing", () => {
  assert.equal(getPaidOrderStatus(), "PREPARING");
});

test("receipt sync failure still sends paid orders to preparing", () => {
  assert.equal(getReceiptSyncFailedOrderStatus(), "PREPARING");
});

test("preparing orders can be marked done", () => {
  assert.deepEqual(getStaffStatusActions("PREPARING"), [
    { label: "Mark Done", nextStatus: "DONE" },
  ]);
});

test("awaiting-payment orders only expose cashier collection action", () => {
  assert.deepEqual(getStaffStatusActions("AWAITING_PAYMENT"), [
    { label: "Collect Payment", nextStatus: "AWAITING_PAYMENT" },
  ]);
});
