"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { canCloseShift, getNextShiftNumber } from "@/lib/shifts/shift-rules";

const shiftRevalidationPaths = [
  "/staff/orders",
  "/staff/cash-drawer",
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

export async function openShiftAction() {
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

export async function closeShiftAction() {
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
      error: "This shift has orders. Close shift only after there are no customer orders.",
    };
  }

  await prisma.shift.update({
    where: { id: shift.id },
    data: {
      status: "CLOSED",
      closedAt: new Date(),
    },
  });

  revalidateShiftViews();
  return { success: true, data: { shiftId: shift.id } };
}
