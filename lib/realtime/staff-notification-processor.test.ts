import assert from "node:assert/strict";
import { test } from "node:test";

import { processStaffNotificationJob } from "./staff-notification-processor";

const order = {
  orderId: "order-1",
  displayNumber: "#1",
  tableCode: "T1",
  customerName: "Aina",
  total: 8,
  itemCount: 1,
};

const subscriptions = [
  {
    endpoint: "https://push.example.com/active",
    p256dh: "key-a",
    auth: "auth-a",
  },
  {
    endpoint: "https://push.example.com/sleeping",
    p256dh: "key-b",
    auth: "auth-b",
  },
];

test("processStaffNotificationJob skips push when every staff tablet is active", async () => {
  let notified = false;

  const result = await processStaffNotificationJob(
    { kind: "staff.order.created", orderId: "order-1" },
    {
      loadOrder: async () => order,
      loadSubscriptions: async () => subscriptions,
      filterInactiveSubscriptions: async () => [],
      notifySubscriptions: async () => {
        notified = true;
        return { sent: 1, failed: 0 };
      },
      disableExpiredSubscription: async () => undefined,
    }
  );

  assert.equal(notified, false);
  assert.deepEqual(result, {
    sent: 0,
    failed: 0,
    skipped: true,
    reason: "active_staff_alerts",
  });
});

test("processStaffNotificationJob sends push only to inactive staff tablets", async () => {
  let notifiedEndpoints: string[] = [];

  const result = await processStaffNotificationJob(
    { kind: "staff.order.created", orderId: "order-1" },
    {
      loadOrder: async () => order,
      loadSubscriptions: async () => subscriptions,
      filterInactiveSubscriptions: async (current) =>
        current.filter((subscription) => subscription.endpoint.endsWith("/sleeping")),
      notifySubscriptions: async ({ subscriptions: current }) => {
        notifiedEndpoints = current.map((subscription) => subscription.endpoint);
        return { sent: 1, failed: 0 };
      },
      disableExpiredSubscription: async () => undefined,
    }
  );

  assert.deepEqual(notifiedEndpoints, ["https://push.example.com/sleeping"]);
  assert.deepEqual(result, { sent: 1, failed: 0 });
});
