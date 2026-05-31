import assert from "node:assert/strict";
import { test } from "node:test";

import {
  STAFF_ALERT_PRESENCE_TTL_SECONDS,
  createStaffAlertPresenceKey,
  filterInactiveStaffPushSubscriptions,
} from "./staff-alert-presence";

test("createStaffAlertPresenceKey hashes endpoints without storing raw URL", () => {
  const endpoint = "https://fcm.googleapis.com/fcm/send/subscription-1";
  const key = createStaffAlertPresenceKey(endpoint);

  assert.match(key, /^staff-alert-presence:[a-f0-9]{64}$/);
  assert.equal(key.includes(endpoint), false);
});

test("filterInactiveStaffPushSubscriptions keeps stale subscriptions push eligible", async () => {
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

  const inactive = await filterInactiveStaffPushSubscriptions(subscriptions, {
    isEndpointActive: async (endpoint) => endpoint.endsWith("/active"),
  });

  assert.deepEqual(inactive, [subscriptions[1]]);
});

test("staff alert presence ttl is short enough for sleep fallback", () => {
  assert.equal(STAFF_ALERT_PRESENCE_TTL_SECONDS, 30);
});
