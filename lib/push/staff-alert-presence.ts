import { createHash } from "node:crypto";

import type { StaffPushSubscriptionInput } from "@/lib/push/staff-alerts";
import { createRedisConnection } from "@/lib/realtime/redis";

export const STAFF_ALERT_PRESENCE_TTL_SECONDS = 30;

export function createStaffAlertPresenceKey(endpoint: string) {
  const endpointHash = createHash("sha256").update(endpoint).digest("hex");
  return `staff-alert-presence:${endpointHash}`;
}

export async function markStaffAlertPresence(endpoint: string) {
  const redis = createRedisConnection();
  try {
    await redis.set(
      createStaffAlertPresenceKey(endpoint),
      "1",
      "EX",
      STAFF_ALERT_PRESENCE_TTL_SECONDS
    );
  } finally {
    await redis.quit();
  }
}

export async function isStaffAlertEndpointActive(endpoint: string) {
  const redis = createRedisConnection();
  try {
    return (await redis.exists(createStaffAlertPresenceKey(endpoint))) === 1;
  } finally {
    await redis.quit();
  }
}

export async function filterInactiveStaffPushSubscriptions(
  subscriptions: StaffPushSubscriptionInput[],
  options: {
    isEndpointActive?: (endpoint: string) => Promise<boolean>;
  } = {}
) {
  const isEndpointActive =
    options.isEndpointActive ?? isStaffAlertEndpointActive;
  const activeStates = await Promise.all(
    subscriptions.map((subscription) => isEndpointActive(subscription.endpoint))
  );

  return subscriptions.filter((_, index) => !activeStates[index]);
}
