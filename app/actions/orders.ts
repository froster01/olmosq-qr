"use server";

import { prisma } from "@/lib/db";
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
  const itemIds = items.map((i) => i.itemId);
  const dbItems = await prisma.item.findMany({
    where: { id: { in: itemIds } },
  });
  if (dbItems.length !== itemIds.length) {
    return { success: false, error: { items: ["One or more items not found"] } };
  }

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const tax = 0; // MVP: no tax
  const total = subtotal + tax;

  // Get next order number
  const lastOrder = await prisma.order.findFirst({
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  });
  const orderNumber = (lastOrder?.orderNumber ?? 0) + 1;

  const order = await prisma.order.create({
    data: {
      orderNumber,
      tableCode,
      customerName,
      subtotal,
      tax,
      total,
      status: "PENDING",
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

  return { success: true, data: { orderId: order.id, orderNumber: order.orderNumber } };
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: string
) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return { success: false, error: "Order not found" };
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus as never },
  });

  return { success: true };
}
