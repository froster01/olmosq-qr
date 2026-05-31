"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { revalidateClosedShiftReportData } from "@/lib/cache/revalidation";
import { calculateCashDrawerTotals } from "@/lib/payments/cash-drawer";
import {
  calculateCashVariance,
  canCloseShift,
  getNextShiftNumber,
  validateShiftCashAmount,
} from "@/lib/shifts/shift-rules";
import { getUnauthorizedStaffActionResult } from "@/lib/staff-auth/guards";

const shiftRevalidationPaths = [
  "/staff/orders",
  "/staff/shift",
  "/staff/shift-reports",
  "/table/[tableCode]",
];

function revalidateShiftViews() {
  for (const path of shiftRevalidationPaths) {
    if (path.includes("[")) {
      revalidatePath(path, "page");
    } else {
      revalidatePath(path);
    }
  }
}

async function getExpectedCashForShift(shiftId: string, startingCash: number) {
  const [orders, movements] = await Promise.all([
    prisma.order.findMany({
      where: { shiftId },
      include: { paymentType: true },
    }),
    prisma.cashMovement.findMany({
      where: { shiftId },
      select: { type: true, amount: true },
    }),
  ]);

  return calculateCashDrawerTotals({
    startingCash,
    orders: orders.map((order) => ({
      status: order.status,
      total: Number(order.total),
      cashReceived:
        order.cashReceived === null ? null : Number(order.cashReceived),
      cashChange: order.cashChange === null ? null : Number(order.cashChange),
      paymentType: order.paymentType,
    })),
    movements: movements.map((movement) => ({
      type: movement.type,
      amount: Number(movement.amount),
    })),
  }).expectedCash;
}

export async function openShiftAction(startingCash: number) {
  const unauthorized = await getUnauthorizedStaffActionResult();
  if (unauthorized) return unauthorized;

  let validatedStartingCash: number;
  try {
    validatedStartingCash = validateShiftCashAmount(startingCash);
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Enter a valid starting cash.",
    };
  }

  const openShift = await prisma.shift.findFirst({
    where: { status: "OPEN" },
    select: { id: true, shiftNumber: true },
  });

  if (openShift) {
    return {
      success: false,
      error: `Shift ${openShift.shiftNumber} is already open.`,
    };
  }

  const shifts = await prisma.shift.findMany({
    select: { shiftNumber: true },
  });
  const shiftNumber = getNextShiftNumber(shifts);

  try {
    const shift = await prisma.shift.create({
      data: {
        shiftNumber,
        status: "OPEN",
        nextOrderNumber: 1,
        startingCash: validatedStartingCash,
      },
    });

    revalidateShiftViews();
    return { success: true, data: { shiftId: shift.id } };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: "Could not open shift. Please refresh and try again.",
    };
  }
}

export async function closeShiftAction(actualCash: number, note?: string) {
  const unauthorized = await getUnauthorizedStaffActionResult();
  if (unauthorized) return unauthorized;

  let validatedActualCash: number;
  try {
    validatedActualCash = validateShiftCashAmount(actualCash);
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Enter a valid counted cash.",
    };
  }

  const shift = await prisma.shift.findFirst({
    where: { status: "OPEN" },
    include: {
      orders: { select: { status: true } },
    },
    orderBy: { openedAt: "desc" },
  });

  if (!shift) {
    return { success: false, error: "No open shift to close." };
  }

  if (!canCloseShift(shift.orders)) {
    return {
      success: false,
      error: "Close shift only after every order is Done or Cancelled.",
    };
  }

  const expectedCash = await getExpectedCashForShift(
    shift.id,
    Number(shift.startingCash)
  );
  const cashVariance = calculateCashVariance({
    expectedCash,
    actualCash: validatedActualCash,
  });

  await prisma.shift.update({
    where: { id: shift.id },
    data: {
      status: "CLOSED",
      closedAt: new Date(),
      actualCash: validatedActualCash,
      cashVariance,
      closedNote: note?.trim() || null,
    },
  });

  revalidateShiftViews();
  revalidateClosedShiftReportData();
  return { success: true, data: { shiftId: shift.id } };
}

export async function createCashMovementAction({
  type,
  amount,
  note,
}: {
  type: "CASH_IN" | "CASH_OUT";
  amount: number;
  note?: string;
}) {
  const unauthorized = await getUnauthorizedStaffActionResult();
  if (unauthorized) return unauthorized;

  if (type !== "CASH_IN" && type !== "CASH_OUT") {
    return { success: false, error: "Choose cash in or cash out." };
  }

  let validatedAmount: number;
  try {
    validatedAmount = validateShiftCashAmount(amount);
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Enter a valid cash amount.",
    };
  }

  if (validatedAmount <= 0) {
    return { success: false, error: "Cash movement amount must be more than 0." };
  }

  const shift = await prisma.shift.findFirst({
    where: { status: "OPEN" },
    select: { id: true },
    orderBy: { openedAt: "desc" },
  });

  if (!shift) {
    return { success: false, error: "Open a shift before recording cash." };
  }

  await prisma.cashMovement.create({
    data: {
      shiftId: shift.id,
      type,
      amount: validatedAmount,
      note: note?.trim() || null,
    },
  });

  revalidateShiftViews();
  return { success: true };
}
