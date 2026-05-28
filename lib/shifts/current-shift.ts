import { prisma } from "@/lib/db";

export function getCurrentShift() {
  return prisma.shift.findFirst({
    where: { status: "OPEN" },
    orderBy: { openedAt: "desc" },
  });
}

export function getLatestClosedShift() {
  return prisma.shift.findFirst({
    where: { status: "CLOSED" },
    orderBy: { closedAt: "desc" },
  });
}

export function getShiftById(shiftId: string) {
  return prisma.shift.findUnique({
    where: { id: shiftId },
    include: {
      orders: {
        include: {
          paymentType: true,
          _count: { select: { items: true } },
        },
        orderBy: { shiftOrderNumber: "asc" },
      },
      cashMovements: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}
