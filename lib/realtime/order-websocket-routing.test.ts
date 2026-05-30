import assert from "node:assert/strict";
import test from "node:test";

import {
  parseOrderSocketSubscription,
  shouldSendEventToSubscription,
} from "./order-websocket-routing";
import type { OrderRealtimeEvent } from "./order-events";

const event: OrderRealtimeEvent = {
  kind: "order.updated",
  orderId: "ord_1",
  staffOrder: {
    id: "ord_1",
    orderNumber: 10,
    shiftOrderNumber: 3,
    tableCode: "T1",
    customerName: "Ari",
    status: "PREPARING",
    total: 12,
    itemCount: 2,
    createdAt: "2026-05-30T10:00:00.000Z",
  },
  customerStatus: {
    orderId: "ord_1",
    status: "PREPARING",
    updatedAt: "2026-05-30T10:05:00.000Z",
    tracking: {
      activeStep: 1,
      headline: "Preparing now",
      detail: "Your order is with the counter team.",
      signal: "In progress",
      steps: [],
    },
  },
};

test("parseOrderSocketSubscription accepts staff and customer URLs", () => {
  assert.deepEqual(
    parseOrderSocketSubscription(new URL("ws://localhost/ws/orders?scope=staff")),
    { scope: "staff" }
  );
  assert.deepEqual(
    parseOrderSocketSubscription(
      new URL("ws://localhost/ws/orders?scope=customer&orderId=ord_1")
    ),
    { scope: "customer", orderId: "ord_1" }
  );
});

test("parseOrderSocketSubscription rejects invalid URLs", () => {
  assert.equal(
    parseOrderSocketSubscription(new URL("ws://localhost/ws/orders?scope=customer")),
    null
  );
  assert.equal(
    parseOrderSocketSubscription(new URL("ws://localhost/ws/orders?scope=kitchen")),
    null
  );
});

test("shouldSendEventToSubscription filters events by subscription", () => {
  assert.equal(shouldSendEventToSubscription({ scope: "staff" }, event), true);
  assert.equal(
    shouldSendEventToSubscription({ scope: "customer", orderId: "ord_1" }, event),
    true
  );
  assert.equal(
    shouldSendEventToSubscription({ scope: "customer", orderId: "ord_2" }, event),
    false
  );
});
