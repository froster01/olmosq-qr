import { Queue } from "bullmq";

import {
  ORDER_EVENTS_QUEUE,
  STAFF_NOTIFICATIONS_QUEUE,
  type OrderEventJobData,
  type StaffNotificationJobData,
} from "@/lib/realtime/order-events";
import { createBullMQConnectionOptions } from "@/lib/realtime/redis";

const globalForQueues = globalThis as unknown as {
  orderEventsQueue?: Queue;
  staffNotificationsQueue?: Queue;
};

function getOrderEventsQueue() {
  if (!globalForQueues.orderEventsQueue) {
    globalForQueues.orderEventsQueue = new Queue(ORDER_EVENTS_QUEUE, {
      connection: createBullMQConnectionOptions(),
    });
  }

  return globalForQueues.orderEventsQueue;
}

function getStaffNotificationsQueue() {
  if (!globalForQueues.staffNotificationsQueue) {
    globalForQueues.staffNotificationsQueue = new Queue(STAFF_NOTIFICATIONS_QUEUE, {
      connection: createBullMQConnectionOptions(),
    });
  }

  return globalForQueues.staffNotificationsQueue;
}

const defaultJobOptions = {
  attempts: 5,
  backoff: { type: "exponential", delay: 1000 },
  removeOnComplete: 100,
  removeOnFail: 500,
} as const;

export async function enqueueOrderCreatedEvent(orderId: string) {
  await getOrderEventsQueue().add(
    "order.created",
    { kind: "order.created", orderId } satisfies OrderEventJobData,
    defaultJobOptions
  );
}

export async function enqueueOrderUpdatedEvent(orderId: string) {
  await getOrderEventsQueue().add(
    "order.updated",
    { kind: "order.updated", orderId } satisfies OrderEventJobData,
    defaultJobOptions
  );
}

export async function enqueueStaffOrderCreatedNotification(orderId: string) {
  await getStaffNotificationsQueue().add(
    "staff.order.created",
    { kind: "staff.order.created", orderId } satisfies StaffNotificationJobData,
    defaultJobOptions
  );
}
