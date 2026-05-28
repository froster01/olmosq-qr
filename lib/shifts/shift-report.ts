import { isCashPaymentType } from "@/lib/payments/cash-drawer";

export type ShiftReportPaymentType = {
  name: string;
  type?: string | null;
};

export type ShiftReportOrder = {
  shiftId?: string | null;
  status: string;
  total: number;
  cashReceived?: number | null;
  cashChange?: number | null;
  paymentType?: ShiftReportPaymentType | null;
};

export type ShiftReportCashMovement = {
  shiftId?: string | null;
  type: "CASH_IN" | "CASH_OUT";
  amount: number;
};

export type ShiftReportSummary = {
  orderCount: number;
  grossSales: number;
  startingCash: number;
  cashSales: number;
  cashReceived: number;
  cashChange: number;
  cashIn: number;
  cashOut: number;
  expectedCash: number;
  actualCash: number | null;
  cashVariance: number | null;
  paymentTypeTotals: Array<{ name: string; total: number }>;
  statusCounts: Array<{ status: string; count: number }>;
};

function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function summarizeShiftReport({
  shiftId,
  startingCash,
  actualCash,
  orders,
  movements = [],
}: {
  shiftId: string;
  startingCash?: number;
  actualCash?: number | null;
  orders: ShiftReportOrder[];
  movements?: ShiftReportCashMovement[];
}): ShiftReportSummary {
  const ordersForShift = orders.filter((order) => order.shiftId === shiftId);
  const movementsForShift = movements.filter(
    (movement) => movement.shiftId === shiftId
  );
  const paymentTotals = new Map<string, number>();
  const statusCounts = new Map<string, number>();

  const roundedStartingCash = roundMoney(startingCash ?? 0);
  let grossSales = 0;
  let cashSales = 0;
  let cashReceived = 0;
  let cashChange = 0;
  let cashIn = 0;
  let cashOut = 0;

  for (const order of ordersForShift) {
    statusCounts.set(order.status, (statusCounts.get(order.status) ?? 0) + 1);

    if (order.status === "CANCELLED") {
      continue;
    }

    const total = roundMoney(order.total);
    grossSales = roundMoney(grossSales + total);

    if (order.paymentType) {
      paymentTotals.set(
        order.paymentType.name,
        roundMoney((paymentTotals.get(order.paymentType.name) ?? 0) + total)
      );
    }

    if (order.paymentType && isCashPaymentType(order.paymentType)) {
      cashSales = roundMoney(cashSales + total);
      cashReceived = roundMoney(cashReceived + (order.cashReceived ?? total));
      cashChange = roundMoney(cashChange + (order.cashChange ?? 0));
    }
  }

  for (const movement of movementsForShift) {
    if (movement.type === "CASH_IN") {
      cashIn = roundMoney(cashIn + movement.amount);
    } else {
      cashOut = roundMoney(cashOut + movement.amount);
    }
  }

  const expectedCash = roundMoney(
    roundedStartingCash + cashSales + cashIn - cashOut
  );
  const roundedActualCash =
    actualCash === null || actualCash === undefined ? null : roundMoney(actualCash);

  return {
    orderCount: ordersForShift.length,
    grossSales,
    startingCash: roundedStartingCash,
    cashSales,
    cashReceived,
    cashChange,
    cashIn,
    cashOut,
    expectedCash,
    actualCash: roundedActualCash,
    cashVariance:
      roundedActualCash === null ? null : roundMoney(roundedActualCash - expectedCash),
    paymentTypeTotals: [...paymentTotals.entries()]
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    statusCounts: [...statusCounts.entries()]
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => a.status.localeCompare(b.status)),
  };
}
