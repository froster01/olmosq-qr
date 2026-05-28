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

  return (
    <OrderDetailView
      order={JSON.parse(JSON.stringify(order))}
    />
  );
}
