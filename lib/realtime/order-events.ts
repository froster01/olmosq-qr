import { z } from "zod";

import type {
  CustomerOrderStatus,
  StaffOrderSummary,
} from "@/lib/orders/order-serialization";

export const ORDER_EVENTS_QUEUE = "order-events";
export const STAFF_NOTIFICATIONS_QUEUE = "staff-notifications";
export const ORDER_REALTIME_CHANNEL = "order-realtime-events";

const orderEventJobSchema = z.object({
  kind: z.enum(["order.created", "order.updated"]),
  orderId: z.string().min(1),
});

const staffNotificationJobSchema = z.object({
  kind: z.literal("staff.order.created"),
  orderId: z.string().min(1),
});

export type OrderEventJobData = z.infer<typeof orderEventJobSchema>;
export type StaffNotificationJobData = z.infer<typeof staffNotificationJobSchema>;

export interface OrderRealtimeEvent {
  kind: OrderEventJobData["kind"];
  orderId: string;
  staffOrder: StaffOrderSummary;
  customerStatus: CustomerOrderStatus;
}

export function parseOrderEventJobData(value: unknown): OrderEventJobData {
  const parsed = orderEventJobSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error("Invalid order event job");
  }
  return parsed.data;
}

export function parseStaffNotificationJobData(
  value: unknown
): StaffNotificationJobData {
  const parsed = staffNotificationJobSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error("Invalid staff notification job");
  }
  return parsed.data;
}
