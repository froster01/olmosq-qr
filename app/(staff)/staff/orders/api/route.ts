import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { items: true } },
    },
  });

  const data = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    tableCode: o.tableCode,
    customerName: o.customerName,
    status: o.status,
    total: Number(o.total),
    itemCount: o._count.items,
    createdAt: o.createdAt.toISOString(),
  }));

  return NextResponse.json(data);
}
