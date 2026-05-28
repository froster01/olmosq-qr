import { prisma } from "@/lib/db";
import { getCurrentShift } from "@/lib/shifts/current-shift";
import { OrdersPageClient } from "./orders-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OrdersPage() {
  const currentShift = await getCurrentShift();
  const orders = currentShift
    ? await prisma.order.findMany({
        where: { shiftId: currentShift.id },
        orderBy: { shiftOrderNumber: "asc" },
        include: {
          _count: { select: { items: true } },
        },
      })
    : [];

  const ordersData = orders.map((o) => ({
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

  return (
    <OrdersPageClient
      initialOrders={ordersData}
      currentShift={
        currentShift
          ? {
              id: currentShift.id,
              shiftNumber: currentShift.shiftNumber,
              openedAt: currentShift.openedAt.toISOString(),
            }
          : null
      }
    />
  );
}
