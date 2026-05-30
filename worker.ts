import "dotenv/config";

import { Worker } from "bullmq";

import {
  ORDER_EVENTS_QUEUE,
  STAFF_NOTIFICATIONS_QUEUE,
} from "@/lib/realtime/order-events";
import { processOrderEventJob } from "@/lib/realtime/order-event-processor";
import { processStaffNotificationJob } from "@/lib/realtime/staff-notification-processor";
import { createBullMQConnectionOptions } from "@/lib/realtime/redis";

const orderEventsWorker = new Worker(
  ORDER_EVENTS_QUEUE,
  async (job) => processOrderEventJob(job.data),
  { connection: createBullMQConnectionOptions() }
);

const staffNotificationsWorker = new Worker(
  STAFF_NOTIFICATIONS_QUEUE,
  async (job) => processStaffNotificationJob(job.data),
  { connection: createBullMQConnectionOptions() }
);

for (const worker of [orderEventsWorker, staffNotificationsWorker]) {
  worker.on("failed", (job, error) => {
    console.error(
      `Worker job failed: ${job?.queueName ?? "unknown"}:${job?.id ?? "unknown"}`,
      error
    );
  });
}

console.log("Order realtime worker started");

async function shutdown() {
  await Promise.all([orderEventsWorker.close(), staffNotificationsWorker.close()]);
  process.exit(0);
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
