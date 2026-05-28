import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { OrderDetailView } from "./order-detail-client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          item: true,
          variant: true,
          modifiers: { include: { modifier: true } },
        },
      },
      paymentType: true,
      syncLogs: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!order) notFound();

  // Serialize Decimal fields to numbers for client component
  const serializedOrder = {
    ...order,
    subtotal: Number(order.subtotal),
    tax: Number(order.tax),
    total: Number(order.total),
    paidAt: order.paidAt?.toISOString() ?? null,
    cashReceived:
      order.cashReceived === null ? null : Number(order.cashReceived),
    cashChange: order.cashChange === null ? null : Number(order.cashChange),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: order.items.map((oi) => ({
      ...oi,
      unitPrice: Number(oi.unitPrice),
      item: { id: oi.item.id, name: oi.item.name },
      variant: oi.variant
        ? { id: oi.variant.id, name: oi.variant.name }
        : null,
      modifiers: oi.modifiers.map((m) => ({
        modifier: { id: m.modifier.id, name: m.modifier.name },
      })),
    })),
    paymentType: order.paymentType
      ? {
          id: order.paymentType.id,
          name: order.paymentType.name,
          type: order.paymentType.type,
        }
      : null,
    syncLogs: order.syncLogs.map((log) => ({
      ...log,
      createdAt: log.createdAt.toISOString(),
    })),
  };

  return <OrderDetailView order={serializedOrder} />;
}
