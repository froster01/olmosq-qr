import { prisma } from "@/lib/db";
import { getCurrentShift } from "@/lib/shifts/current-shift";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const currentShift = await getCurrentShift();
  if (!currentShift) {
    return NextResponse.json([]);
  }

  const orders = await prisma.order.findMany({
    where: { shiftId: currentShift.id },
    orderBy: { shiftOrderNumber: "asc" },
    include: {
      _count: { select: { items: true } },
    },
  });

  const data = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    shiftOrderNumber: o.shiftOrderNumber,
    tableCode: o.tableCode,
    customerName: o.customerName,
    status: o.status,
    total: Number(o.total),
    itemCount: o._count.items,
    createdAt: o.createdAt.toISOString(),
  }));

  return NextResponse.json(data);
}
