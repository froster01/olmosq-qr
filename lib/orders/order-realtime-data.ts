import { prisma } from "@/lib/db";
import {
  serializeCustomerOrderStatus,
  serializeStaffOrderSummary,
} from "@/lib/orders/order-serialization";
import { formatOrderDisplayNumber } from "@/lib/shifts/shift-rules";
import type { OrderRealtimeEvent } from "@/lib/realtime/order-events";
import type { StaffOrderAlertInput } from "@/lib/push/staff-alerts";

const staffOrderInclude = {
  _count: { select: { items: true } },
} as const;

export async function getCurrentShiftOrderSummaries() {
  const currentShift = await prisma.shift.findFirst({
    where: { status: "OPEN" },
    orderBy: { openedAt: "desc" },
    select: { id: true },
  });

  if (!currentShift) {
    return [];
  }

  const orders = await prisma.order.findMany({
    where: { shiftId: currentShift.id },
    orderBy: { shiftOrderNumber: "desc" },
    include: staffOrderInclude,
  });

  return orders.map(serializeStaffOrderSummary);
}

export async function getOrderRealtimeEvent({
  kind,
  orderId,
}: {
  kind: OrderRealtimeEvent["kind"];
  orderId: string;
}): Promise<OrderRealtimeEvent | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: staffOrderInclude,
  });

  if (!order) {
    return null;
  }

  return {
    kind,
    orderId,
    staffOrder: serializeStaffOrderSummary(order),
    customerStatus: serializeCustomerOrderStatus(order),
  };
}

export async function getCustomerOrderStatus(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      updatedAt: true,
    },
  });

  return order ? serializeCustomerOrderStatus(order) : null;
}

export async function getStaffNotificationOrder(
  orderId: string
): Promise<StaffOrderAlertInput | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: staffOrderInclude,
  });

  if (!order) {
    return null;
  }

  return {
    orderId: order.id,
    displayNumber: formatOrderDisplayNumber({
      shiftOrderNumber: order.shiftOrderNumber,
      orderNumber: order.orderNumber,
    }),
    tableCode: order.tableCode,
    customerName: order.customerName,
    total: Number(order.total),
    itemCount: order._count.items,
  };
}
