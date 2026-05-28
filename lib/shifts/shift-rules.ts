export type ShiftOrderNumberSource = {
  shiftOrderNumber?: number | null;
  orderNumber: number;
};

export type ShiftNumberSource = {
  shiftNumber: number;
};

export type ShiftOrderCounter = {
  nextOrderNumber: number;
};

export type OrderStatusSource = {
  status: string;
};

const finalOrderStatuses = new Set(["DONE", "CANCELLED"]);

function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function formatOrderDisplayNumber({
  shiftOrderNumber,
  orderNumber,
}: ShiftOrderNumberSource): string {
  if (typeof shiftOrderNumber === "number") {
    return `#${shiftOrderNumber.toString().padStart(4, "0")}`;
  }

  return `#${orderNumber}`;
}

export function getNextShiftNumber(shifts: ShiftNumberSource[]): number {
  if (shifts.length === 0) return 1;
  return Math.max(...shifts.map((shift) => shift.shiftNumber)) + 1;
}

export function getShiftOrderAssignment({
  nextOrderNumber,
}: ShiftOrderCounter): {
  shiftOrderNumber: number;
  nextOrderNumber: number;
} {
  return {
    shiftOrderNumber: nextOrderNumber,
    nextOrderNumber: nextOrderNumber + 1,
  };
}

export function canCloseShift(orders: OrderStatusSource[]): boolean {
  return orders.every((order) => finalOrderStatuses.has(order.status));
}

export function validateShiftCashAmount(amount: number): number {
  if (!Number.isFinite(amount)) {
    throw new Error("Enter a valid cash amount");
  }

  if (amount < 0) {
    throw new Error("Cash amount cannot be negative");
  }

  return roundMoney(amount);
}

export function calculateCashVariance({
  expectedCash,
  actualCash,
}: {
  expectedCash: number;
  actualCash: number;
}): number {
  return roundMoney(actualCash - expectedCash);
}
