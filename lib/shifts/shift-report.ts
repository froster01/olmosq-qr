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

export type ShiftReportSummary = {
  orderCount: number;
  grossSales: number;
  cashSales: number;
  cashReceived: number;
  cashChange: number;
  paymentTypeTotals: Array<{ name: string; total: number }>;
  statusCounts: Array<{ status: string; count: number }>;
};

function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function summarizeShiftReport({
  shiftId,
  orders,
}: {
  shiftId: string;
  orders: ShiftReportOrder[];
}): ShiftReportSummary {
  const ordersForShift = orders.filter((order) => order.shiftId === shiftId);
  const paymentTotals = new Map<string, number>();
  const statusCounts = new Map<string, number>();

  let grossSales = 0;
  let cashSales = 0;
  let cashReceived = 0;
  let cashChange = 0;

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

  return {
    orderCount: ordersForShift.length,
    grossSales,
    cashSales,
    cashReceived,
    cashChange,
    paymentTypeTotals: [...paymentTotals.entries()]
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    statusCounts: [...statusCounts.entries()]
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => a.status.localeCompare(b.status)),
  };
}
