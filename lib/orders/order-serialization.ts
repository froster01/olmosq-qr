import type { OrderStatus } from "@prisma/client";

import { getCustomerTrackingState } from "@/lib/orders/customer-tracking";

type DecimalLike = number | string | { toString(): string };

export interface StaffOrderSummarySource {
  id: string;
  orderNumber: number;
  shiftOrderNumber: number | null;
  tableCode: string;
  customerName: string;
  status: OrderStatus | string;
  total: DecimalLike;
  createdAt: Date;
  _count: { items: number };
}

export interface StaffOrderSummary {
  id: string;
  orderNumber: number;
  shiftOrderNumber: number | null;
  tableCode: string;
  customerName: string;
  status: OrderStatus | string;
  total: number;
  itemCount: number;
  createdAt: string;
}

export interface CustomerOrderStatusSource {
  id: string;
  status: OrderStatus | string;
  updatedAt: Date;
}

export interface CustomerOrderStatus {
  orderId: string;
  status: OrderStatus | string;
  updatedAt: string;
  tracking: ReturnType<typeof getCustomerTrackingState>;
}

export function serializeStaffOrderSummary(
  order: StaffOrderSummarySource
): StaffOrderSummary {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    shiftOrderNumber: order.shiftOrderNumber,
    tableCode: order.tableCode,
    customerName: order.customerName,
    status: order.status,
    total: Number(order.total),
    itemCount: order._count.items,
    createdAt: order.createdAt.toISOString(),
  };
}

export function serializeCustomerOrderStatus(
  order: CustomerOrderStatusSource
): CustomerOrderStatus {
  return {
    orderId: order.id,
    status: order.status,
    updatedAt: order.updatedAt.toISOString(),
    tracking: getCustomerTrackingState(order.status),
  };
}
