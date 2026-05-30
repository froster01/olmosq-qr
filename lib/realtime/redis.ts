import IORedis from "ioredis";

const globalForRedis = globalThis as unknown as {
  orderRealtimeRedisPublisher?: IORedis;
};

export function getRedisUrl() {
  return process.env.REDIS_URL || "redis://localhost:6379";
}

export function createRedisConnection() {
  return new IORedis(getRedisUrl(), {
    maxRetriesPerRequest: null,
    retryStrategy: (times) => Math.min(times * 1000, 10000),
  });
}

export function createBullMQConnectionOptions() {
  const redisUrl = new URL(getRedisUrl());

  return {
    host: redisUrl.hostname,
    port: Number(redisUrl.port || 6379),
    username: redisUrl.username
      ? decodeURIComponent(redisUrl.username)
      : undefined,
    password: redisUrl.password
      ? decodeURIComponent(redisUrl.password)
      : undefined,
    maxRetriesPerRequest: null,
    retryStrategy: (times: number) => Math.min(times * 1000, 10000),
    tls: redisUrl.protocol === "rediss:" ? {} : undefined,
  };
}

export function getRedisPublisher() {
  if (!globalForRedis.orderRealtimeRedisPublisher) {
    globalForRedis.orderRealtimeRedisPublisher = createRedisConnection();
  }

  return globalForRedis.orderRealtimeRedisPublisher;
}
