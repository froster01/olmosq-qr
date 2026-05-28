import { prisma } from "@/lib/db";
import { OrdersPageClient } from "./orders-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { items: true } },
    },
  });

  const ordersData = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    tableCode: o.tableCode,
    customerName: o.customerName,
    status: o.status,
    total: Number(o.total),
    itemCount: o._count.items,
    createdAt: o.createdAt.toISOString(),
  }));

  return <OrdersPageClient initialOrders={ordersData} />;
}
