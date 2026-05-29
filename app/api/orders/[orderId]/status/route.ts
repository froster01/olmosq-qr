import { prisma } from "@/lib/db";
import { getCustomerTrackingState } from "@/lib/orders/customer-tracking";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      updatedAt: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({
    orderId: order.id,
    status: order.status,
    updatedAt: order.updatedAt.toISOString(),
    tracking: getCustomerTrackingState(order.status),
  });
}
