import { unstable_cache } from "next/cache";

import { CLOSED_SHIFT_REPORT_CACHE_TAG } from "@/lib/cache/revalidation";

function serializeDate(value: Date | string | null) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

export const getCachedClosedShiftReport = unstable_cache(
  async (shiftId: string) => {
    const { prisma } = await import("@/lib/db");
    const shift = await prisma.shift.findFirst({
      where: { id: shiftId, status: "CLOSED" },
      include: {
        orders: {
          include: {
            paymentType: true,
          },
          orderBy: { shiftOrderNumber: "asc" },
        },
        cashMovements: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!shift) return null;

    return {
      ...shift,
      openedAt: serializeDate(shift.openedAt),
      closedAt: serializeDate(shift.closedAt),
      createdAt: serializeDate(shift.createdAt),
      updatedAt: serializeDate(shift.updatedAt),
      startingCash: Number(shift.startingCash),
      actualCash:
        shift.actualCash === null ? null : Number(shift.actualCash),
      cashVariance:
        shift.cashVariance === null ? null : Number(shift.cashVariance),
      orders: shift.orders.map((order) => ({
        ...order,
        subtotal: Number(order.subtotal),
        tax: Number(order.tax),
        total: Number(order.total),
        cashReceived:
          order.cashReceived === null ? null : Number(order.cashReceived),
        cashChange: order.cashChange === null ? null : Number(order.cashChange),
        paidAt: serializeDate(order.paidAt),
        createdAt: serializeDate(order.createdAt),
        updatedAt: serializeDate(order.updatedAt),
        paymentType: order.paymentType
          ? {
              ...order.paymentType,
              createdAt: serializeDate(order.paymentType.createdAt),
              updatedAt: serializeDate(order.paymentType.updatedAt),
            }
          : null,
      })),
      cashMovements: shift.cashMovements.map((movement) => ({
        ...movement,
        amount: Number(movement.amount),
        createdAt: serializeDate(movement.createdAt),
      })),
    };
  },
  ["closed-shift-report"],
  { tags: [CLOSED_SHIFT_REPORT_CACHE_TAG] }
);
