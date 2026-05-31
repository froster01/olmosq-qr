import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildNewOrderFallbackPushPayload,
  getStaffPushConfig,
  notifyNewStaffFallbackOrder,
  notifyStaffFallbackSubscriptions,
} from "./staff-fallback-alerts";

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

test("buildNewOrderFallbackPushPayload creates staff order alert payload", () => {
  const payload = buildNewOrderFallbackPushPayload({
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

test("notifyStaffFallbackSubscriptions reports skipped sends as failed when push is unconfigured", async () => {
  const result = await notifyStaffFallbackSubscriptions({
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

test("notifyNewStaffFallbackOrder skips when staff orders page is active", async () => {
  const result = await notifyNewStaffFallbackOrder({
    order: {
      orderId: "order-1",
      displayNumber: "#12",
      tableCode: "T2",
      customerName: "Aina",
      total: 18.5,
      itemCount: 3,
    },
    isStaffActive: async () => true,
    loadSubscriptions: async () => {
      throw new Error("should not load subscriptions while active");
    },
    notifySubscriptions: async () => {
      throw new Error("should not notify while active");
    },
  });

  assert.deepEqual(result, { sent: 0, failed: 0, skipped: true });
});
