import { createRedisConnection } from "@/lib/realtime/redis";

export const STAFF_ORDERS_PAGE_ACTIVE_KEY = "staff:orders-page:active";
export const STAFF_ORDERS_PAGE_ACTIVE_TTL_SECONDS = 20;

type StaffPresenceRedis = {
  exists: (key: string) => Promise<number>;
  set: (
    key: string,
    value: string,
    mode: "EX",
    seconds: number
  ) => Promise<unknown>;
};

export async function markStaffOrdersPageActive(
  redis: StaffPresenceRedis = createRedisConnection()
) {
  await redis.set(
    STAFF_ORDERS_PAGE_ACTIVE_KEY,
    String(Date.now()),
    "EX",
    STAFF_ORDERS_PAGE_ACTIVE_TTL_SECONDS
  );
}

export async function isStaffOrdersPageActive(
  redis: StaffPresenceRedis = createRedisConnection()
) {
  return (await redis.exists(STAFF_ORDERS_PAGE_ACTIVE_KEY)) > 0;
}
