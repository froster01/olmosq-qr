import assert from "node:assert/strict";
import test from "node:test";

import {
  serializeCustomerOrderStatus,
  serializeStaffOrderSummary,
} from "./order-serialization";

test("serializeStaffOrderSummary returns the staff feed shape", () => {
  const summary = serializeStaffOrderSummary({
    id: "ord_1",
    orderNumber: 42,
    shiftOrderNumber: 7,
    tableCode: "T3",
    customerName: "Maya",
    status: "AWAITING_PAYMENT",
    total: { toString: () => "18.50" },
    createdAt: new Date("2026-05-30T10:15:00.000Z"),
    _count: { items: 3 },
  });

  assert.deepEqual(summary, {
    id: "ord_1",
    orderNumber: 42,
    shiftOrderNumber: 7,
    tableCode: "T3",
    customerName: "Maya",
    status: "AWAITING_PAYMENT",
    total: 18.5,
    itemCount: 3,
    createdAt: "2026-05-30T10:15:00.000Z",
  });
});

test("serializeCustomerOrderStatus returns tracking metadata for one order", () => {
  const status = serializeCustomerOrderStatus({
    id: "ord_1",
    status: "PREPARING",
    updatedAt: new Date("2026-05-30T10:20:00.000Z"),
  });

  assert.equal(status.orderId, "ord_1");
  assert.equal(status.status, "PREPARING");
  assert.equal(status.updatedAt, "2026-05-30T10:20:00.000Z");
  assert.equal(status.tracking.signal, "In progress");
});
