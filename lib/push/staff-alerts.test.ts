import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildNewOrderPushPayload,
  getStaffPushConfig,
  notifyNewStaffOrder,
  notifyStaffPushSubscriptions,
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

test("buildNewOrderPushPayload creates staff order alert payload", () => {
  const payload = buildNewOrderPushPayload({
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

test("notifyStaffPushSubscriptions reports skipped sends as failed when push is unconfigured", async () => {
  const result = await notifyStaffPushSubscriptions({
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
    logger: {
      error: () => undefined,
    },
  });

  assert.deepEqual(result, { sent: 0, failed: 1 });
});

test("notifyStaffPushSubscriptions logs failed send details", async () => {
  const errors: Array<{ message: string; error: unknown }> = [];

  await notifyStaffPushSubscriptions({
    subscriptions: [
      {
        endpoint: "https://updates.push.services.mozilla.com/subscription-1",
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
    logger: {
      error: (message, error) => errors.push({ message, error }),
    },
  });

  assert.equal(errors.length, 1);
  assert.equal(errors[0]?.message, "Failed to send staff push notification");
  assert.deepEqual(errors[0]?.error, {
    endpointHost: "updates.push.services.mozilla.com",
    skipped: true,
  });
});

test("notifyNewStaffOrder sends to subscriptions without active-page suppression", async () => {
  let loadedSubscriptions = false;
  let notifiedSubscriptions = false;

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
      loadedSubscriptions = true;
      return [
        {
          endpoint: "https://push.example.com/subscription-1",
          p256dh: "key",
          auth: "auth",
        },
      ];
    },
    notifySubscriptions: async ({ subscriptions, payload }) => {
      notifiedSubscriptions = true;
      assert.equal(subscriptions.length, 1);
      assert.equal(payload.title, "New order #12");
      return { sent: 1, failed: 0 };
    },
  });

  assert.equal(loadedSubscriptions, true);
  assert.equal(notifiedSubscriptions, true);
  assert.deepEqual(result, { sent: 1, failed: 0 });
});
