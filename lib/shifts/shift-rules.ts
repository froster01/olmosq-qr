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
  return orders.length === 0;
}
