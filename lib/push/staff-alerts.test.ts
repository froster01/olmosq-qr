import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildNewOrderNotificationPayload,
  getStaffPushConfig,
  notifyNewStaffOrder,
  notifyStaffSubscriptions,
} from "./staff-alerts";

test("getStaffPushConfig returns disabled when VAPID env is incomplete", () => {
  const config = getStaffPushConfig({
    NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY: "public-key",
    WEB_PUSH_CONTACT_EMAIL: "staff@example.com",
  });

  assert.deepEqual(config, { enabled: false, publicKey: "public-key" });
});

test("getStaffPushConfig includes normalized VAPID subject when configured", () => {
  const config = getStaffPushConfig({
    NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY: "public-key",
    WEB_PUSH_VAPID_PRIVATE_KEY: "private-key",
    WEB_PUSH_CONTACT_EMAIL: "staff@example.com",
  });

  assert.deepEqual(config, {
    enabled: true,
    publicKey: "public-key",
    privateKey: "private-key",
    subject: "mailto:staff@example.com",
  });
});

test("buildNewOrderNotificationPayload creates staff order alert payload", () => {
  const payload = buildNewOrderNotificationPayload({
    orderId: "order-1",
    displayNumber: "#12",
    tableCode: "T2",
    customerName: "Aina",
    total: 18.5,
    itemCount: 3,
  });

  assert.deepEqual(payload, {
    title: "New order #12",
    body: "Table T2, Aina, 3 items, RM 18.50",
    url: "/staff/orders/order-1",
    tag: "order-order-1",
  });
});

test("notifyStaffSubscriptions reports skipped sends as failed when push is unconfigured", async () => {
  const result = await notifyStaffSubscriptions({
    subscriptions: [
      {
        endpoint: "https://push.example.com/subscription-1",
        p256dh: "key",
        auth: "auth",
      },
    ],
    payload: {
      title: "New order #12",
      body: "Table T2",
      url: "/staff/orders/order-1",
      tag: "order-order-1",
    },
  });

  assert.deepEqual(result, { sent: 0, failed: 1 });
});

test("notifyNewStaffOrder does not throw when subscription storage is unavailable", async () => {
  let loggedError: unknown = null;

  const result = await notifyNewStaffOrder({
    order: {
      orderId: "order-1",
      displayNumber: "#12",
      tableCode: "T2",
      customerName: "Aina",
      total: 18.5,
      itemCount: 3,
    },
    loadSubscriptions: async () => {
      throw new Error("TableDoesNotExist");
    },
    notifySubscriptions: async () => {
      throw new Error("should not send without subscriptions");
    },
    logger: {
      error: (_message, error) => {
        loggedError = error;
      },
    },
  });

  assert.deepEqual(result, { sent: 0, failed: 0, skipped: true });
  assert.ok(loggedError instanceof Error);
  assert.equal(loggedError.message, "TableDoesNotExist");
});
