"use server";

import { prisma } from "@/lib/db";
import { getCheckoutOrderStatus } from "@/lib/orders/status-flow";
import {
  getUniqueOrderItemIds,
  hasAllRequestedItems,
} from "@/lib/orders/submit-order-validation";
import { getCurrentShift } from "@/lib/shifts/current-shift";
import { z } from "zod";

const submitOrderSchema = z.object({
  tableCode: z.string(),
  customerName: z.string().min(1, "Name is required"),
  items: z.array(
    z.object({
      itemId: z.string(),
      variantId: z.string().optional(),
      quantity: z.number().int().min(1),
      unitPrice: z.number(),
      modifierIds: z.array(z.string()),
      notes: z.string().optional(),
    })
  ),
});

const updateOrderStatusSchema = z.enum([
  "PENDING",
  "ACCEPTED",
  "PREPARING",
  "AWAITING_PAYMENT",
  "PAID_SYNCING",
  "PAID_SYNCED_TO_LOYVERSE",
  "PAID_SYNC_FAILED",
  "DONE",
  "CANCELLED",
]);

export async function submitOrder(formData: FormData) {
  const raw = {
    tableCode: formData.get("tableCode") as string,
    customerName: formData.get("customerName") as string,
    items: JSON.parse(formData.get("items") as string),
  };

  const parsed = submitOrderSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  const { tableCode, customerName, items } = parsed.data;

  // Validate table exists
  const table = await prisma.table.findUnique({ where: { code: tableCode } });
  if (!table || !table.isActive) {
    return { success: false, error: { tableCode: ["Invalid or inactive table"] } };
  }

  // Validate items exist
  const itemIds = getUniqueOrderItemIds(items);
  const dbItems = await prisma.item.findMany({
    where: { id: { in: itemIds } },
    select: { id: true },
  });
  if (
    !hasAllRequestedItems({
      requestedItemIds: itemIds,
      foundItemIds: dbItems.map((item) => item.id),
    })
  ) {
    return { success: false, error: { items: ["One or more items not found"] } };
  }

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const tax = 0; // MVP: no tax
  const total = subtotal + tax;

  return prisma.$transaction(async (tx) => {
    const shift = await tx.shift.findFirst({
      where: { status: "OPEN" },
      select: { id: true },
      orderBy: { openedAt: "desc" },
    });

    if (!shift) {
      return {
        success: false,
        error: { shift: ["Shop is currently closed"] },
      };
    }

    // Keep the legacy global number unique while display numbers restart per shift.
    const lastOrder = await tx.order.findFirst({
      orderBy: { orderNumber: "desc" },
      select: { orderNumber: true },
    });
    const orderNumber = (lastOrder?.orderNumber ?? 0) + 1;

    const updatedShift = await tx.shift.update({
      where: { id: shift.id },
      data: { nextOrderNumber: { increment: 1 } },
      select: { nextOrderNumber: true },
    });
    const shiftOrderNumber = updatedShift.nextOrderNumber - 1;

    const order = await tx.order.create({
      data: {
        orderNumber,
        shiftId: shift.id,
        shiftOrderNumber,
        tableCode,
        customerName,
        subtotal,
        tax,
        total,
        customerPaymentMethod: "COUNTER",
        status: getCheckoutOrderStatus(),
        items: {
          create: items.map((item) => ({
            itemId: item.itemId,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            notes: item.notes,
            modifiers: {
              create: item.modifierIds.map((modId) => ({
                modifierId: modId,
              })),
            },
          })),
        },
      },
    });

    return {
      success: true,
      data: { orderId: order.id, orderNumber: order.orderNumber },
    };
  });
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: string
) {
  const parsedStatus = updateOrderStatusSchema.safeParse(newStatus);
  if (!parsedStatus.success) {
    return { success: false, error: "Invalid order status" };
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return { success: false, error: "Order not found" };
  }

  const openShift = await getCurrentShift();
  if (!openShift || order.shiftId !== openShift.id) {
    return {
      success: false,
      error: "This order belongs to a closed shift and cannot be changed.",
    };
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: parsedStatus.data },
  });

  return { success: true };
}
