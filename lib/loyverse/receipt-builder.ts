import { prisma } from "@/lib/db";
import { post } from "./client";

interface ReceiptLineItem {
  item_variant_id: string;
  quantity: number;
  modifiers: Array<{ modifier_id: string }>;
}

interface ReceiptPayment {
  payment_type_id: string;
  amount: number;
}

interface ReceiptPayload {
  store_id: string;
  order: string;
  note: string;
  line_items: ReceiptLineItem[];
  payments: ReceiptPayment[];
}

export async function buildReceiptPayload(
  orderId: string
): Promise<ReceiptPayload> {
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
    },
  });

  if (!order) throw new Error("Order not found");

  const storeId = process.env.LOYVERSE_STORE_ID;
  if (!storeId) throw new Error("LOYVERSE_STORE_ID is not set");

  const lineItems: ReceiptLineItem[] = order.items.map((oi) => {
    const variantLoyverseId = oi.variant?.loyverseId;
    if (!variantLoyverseId) {
      // Use the first variant of the item if no specific variant selected
      // Fall back to item loyverseId
      return {
        item_variant_id: oi.item.loyverseId,
        quantity: oi.quantity,
        modifiers: oi.modifiers.map((m) => ({
          modifier_id: m.modifier.loyverseId,
        })),
      };
    }
    return {
      item_variant_id: variantLoyverseId,
      quantity: oi.quantity,
      modifiers: oi.modifiers.map((m) => ({
        modifier_id: m.modifier.loyverseId,
      })),
    };
  });

  return {
    store_id: storeId,
    order: `QR-${order.orderNumber} / Table ${order.tableCode}`,
    note: `Customer: ${order.customerName}`,
    line_items: lineItems,
    payments: [],
  };
}

export async function createLoyverseReceipt(
  orderId: string,
  paymentTypeId: string,
  amount: number
): Promise<{ receiptNumber: string }> {
  const payload = await buildReceiptPayload(orderId);
  payload.payments = [{ payment_type_id: paymentTypeId, amount }];

  const response = await post<{ receipt_number: string }>(
    "/receipts",
    payload
  );

  return { receiptNumber: response.receipt_number };
}
