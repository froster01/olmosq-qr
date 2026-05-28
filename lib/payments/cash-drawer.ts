import { formatReceiptMoney } from "@/lib/orders/receipt-summary";
import { calculateCashChange } from "./cash-change";

export interface PaymentTypeLike {
  name: string;
  type?: string | null;
}

export interface CashDrawerOrderLike {
  status?: string;
  total: number;
  cashReceived?: number | null;
  cashChange?: number | null;
  paymentType?: PaymentTypeLike | null;
}

export interface CashMovementLike {
  type: "CASH_IN" | "CASH_OUT";
  amount: number;
}

export interface CashDrawerSummary {
  orderCount: number;
  salesTotal: number;
  cashReceivedTotal: number;
  changeGivenTotal: number;
  expectedCashImpact: number;
}

export interface CashDrawerTotals extends CashDrawerSummary {
  startingCash: number;
  cashInTotal: number;
  cashOutTotal: number;
  expectedCash: number;
}

function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function isCashPaymentType(paymentType: PaymentTypeLike): boolean {
  return paymentType.type === "CASH";
}

export function validateCashPayment({
  paymentType,
  total,
  cashReceived,
}: {
  paymentType: PaymentTypeLike;
  total: number;
  cashReceived?: number | null;
}): { cashReceived: number | null; cashChange: number | null } {
  if (!isCashPaymentType(paymentType)) {
    return { cashReceived: null, cashChange: null };
  }

  if (cashReceived === null || cashReceived === undefined) {
    throw new Error("Cash received is required for cash payments");
  }

  const cashResult = calculateCashChange({ total, received: cashReceived });
  if (!cashResult.isEnough) {
    throw new Error(
      `Cash received is short by ${formatReceiptMoney(cashResult.remaining)}`
    );
  }

  return {
    cashReceived: roundMoney(cashReceived),
    cashChange: cashResult.change,
  };
}

export function summarizeCashDrawer(
  orders: CashDrawerOrderLike[]
): CashDrawerSummary {
  return orders.reduce<CashDrawerSummary>(
    (summary, order) => {
      if (order.status === "CANCELLED") {
        return summary;
      }

      if (!order.paymentType || !isCashPaymentType(order.paymentType)) {
        return summary;
      }

      const total = roundMoney(order.total);
      const cashReceived = roundMoney(order.cashReceived ?? total);
      const cashChange = roundMoney(order.cashChange ?? cashReceived - total);

      return {
        orderCount: summary.orderCount + 1,
        salesTotal: roundMoney(summary.salesTotal + total),
        cashReceivedTotal: roundMoney(
          summary.cashReceivedTotal + cashReceived
        ),
        changeGivenTotal: roundMoney(
          summary.changeGivenTotal + Math.max(cashChange, 0)
        ),
        expectedCashImpact: roundMoney(summary.expectedCashImpact + total),
      };
    },
    {
      orderCount: 0,
      salesTotal: 0,
      cashReceivedTotal: 0,
      changeGivenTotal: 0,
      expectedCashImpact: 0,
    }
  );
}

export function calculateCashDrawerTotals({
  startingCash,
  orders,
  movements,
}: {
  startingCash: number;
  orders: CashDrawerOrderLike[];
  movements: CashMovementLike[];
}): CashDrawerTotals {
  const orderSummary = summarizeCashDrawer(orders);
  const movementTotals = movements.reduce(
    (summary, movement) => {
      if (movement.type === "CASH_IN") {
        return {
          ...summary,
          cashInTotal: roundMoney(summary.cashInTotal + movement.amount),
        };
      }

      return {
        ...summary,
        cashOutTotal: roundMoney(summary.cashOutTotal + movement.amount),
      };
    },
    { cashInTotal: 0, cashOutTotal: 0 }
  );

  const roundedStartingCash = roundMoney(startingCash);

  return {
    ...orderSummary,
    startingCash: roundedStartingCash,
    cashInTotal: movementTotals.cashInTotal,
    cashOutTotal: movementTotals.cashOutTotal,
    expectedCash: roundMoney(
      roundedStartingCash +
        orderSummary.expectedCashImpact +
        movementTotals.cashInTotal -
        movementTotals.cashOutTotal
    ),
  };
}
