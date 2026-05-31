import { unstable_cache } from "next/cache";

import { CLOSED_SHIFT_REPORT_CACHE_TAG } from "@/lib/cache/revalidation";
import { calculateCashDrawerTotals } from "@/lib/payments/cash-drawer";

type DateLike = Date | string | null;
type MoneyLike = number | string | { toString(): string };

type RawClosedShiftReportSummary = {
  id: string;
  shiftNumber: number;
  openedAt: DateLike;
  closedAt: DateLike;
  startingCash: MoneyLike;
  actualCash: MoneyLike | null;
  orders: {
    status?: string;
    total: MoneyLike;
    cashReceived?: MoneyLike | null;
    cashChange?: MoneyLike | null;
    paymentType?: {
      name: string;
      type?: string | null;
    } | null;
  }[];
  cashMovements: {
    type: "CASH_IN" | "CASH_OUT";
    amount: MoneyLike;
  }[];
};

export type ClosedShiftReportSummary = {
  id: string;
  shiftNumber: number;
  openedAt: string | null;
  closedAt: string | null;
  actualCash: number | null;
  expectedCash: number;
  orderCount: number;
  cashMovementCount: number;
};

function serializeDate(value: DateLike) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function serializeMoney(value: MoneyLike) {
  return Number(value);
}

export function serializeClosedShiftReportSummaries(
  shifts: RawClosedShiftReportSummary[]
): ClosedShiftReportSummary[] {
  return shifts.map((shift) => {
    const totals = calculateCashDrawerTotals({
      startingCash: serializeMoney(shift.startingCash),
      orders: shift.orders.map((order) => ({
        status: order.status,
        total: serializeMoney(order.total),
        cashReceived:
          order.cashReceived === null || order.cashReceived === undefined
            ? null
            : serializeMoney(order.cashReceived),
        cashChange:
          order.cashChange === null || order.cashChange === undefined
            ? null
            : serializeMoney(order.cashChange),
        paymentType: order.paymentType,
      })),
      movements: shift.cashMovements.map((movement) => ({
        type: movement.type,
        amount: serializeMoney(movement.amount),
      })),
    });

    return {
      id: shift.id,
      shiftNumber: shift.shiftNumber,
      openedAt: serializeDate(shift.openedAt),
      closedAt: serializeDate(shift.closedAt),
      actualCash:
        shift.actualCash === null ? null : serializeMoney(shift.actualCash),
      expectedCash: totals.expectedCash,
      orderCount: shift.orders.length,
      cashMovementCount: shift.cashMovements.length,
    };
  });
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

export const getCachedClosedShiftReportSummaries = unstable_cache(
  async () => {
    const { prisma } = await import("@/lib/db");
    const shifts = await prisma.shift.findMany({
      where: { status: "CLOSED" },
      select: {
        id: true,
        shiftNumber: true,
        openedAt: true,
        closedAt: true,
        startingCash: true,
        actualCash: true,
        orders: {
          select: {
            status: true,
            total: true,
            cashReceived: true,
            cashChange: true,
            paymentType: {
              select: {
                name: true,
                type: true,
              },
            },
          },
        },
        cashMovements: {
          select: {
            type: true,
            amount: true,
          },
        },
      },
      orderBy: { closedAt: "desc" },
      take: 20,
    });

    return serializeClosedShiftReportSummaries(shifts);
  },
  ["closed-shift-report-summaries"],
  { tags: [CLOSED_SHIFT_REPORT_CACHE_TAG] }
);

export const getCachedClosedShiftCount = unstable_cache(
  async () => {
    const { prisma } = await import("@/lib/db");
    return prisma.shift.count({
      where: { status: "CLOSED" },
    });
  },
  ["closed-shift-count"],
  { tags: [CLOSED_SHIFT_REPORT_CACHE_TAG] }
);
