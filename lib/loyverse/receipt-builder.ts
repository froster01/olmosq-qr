import { prisma } from "@/lib/db";
import { formatOrderDisplayNumber } from "@/lib/shifts/shift-rules";
import { post } from "./client";

interface ReceiptLineItem {
  variant_id: string;
  quantity: number;
  line_modifiers?: Array<{ modifier_option_id: string }>;
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

export function resolveReceiptVariantId({
  selectedVariantLoyverseId,
  itemName,
  variants,
}: {
  selectedVariantLoyverseId?: string | null;
  itemName: string;
  variants: Array<{ loyverseId: string }>;
}): string {
  const variantId = selectedVariantLoyverseId ?? variants[0]?.loyverseId;
  if (!variantId) {
    throw new Error(`No Loyverse variant found for item "${itemName}"`);
  }
  return variantId;
}

export function buildReceiptLineItem({
  itemName,
  quantity,
  selectedVariantLoyverseId,
  variants,
  modifiers,
}: {
  itemName: string;
  quantity: number;
  selectedVariantLoyverseId?: string | null;
  variants: Array<{ loyverseId: string }>;
  modifiers: Array<{ loyverseId: string }>;
}): ReceiptLineItem {
  const lineModifiers = modifiers.map((modifier) => ({
    modifier_option_id: modifier.loyverseId,
  }));

  return {
    variant_id: resolveReceiptVariantId({
      selectedVariantLoyverseId,
      itemName,
      variants,
    }),
    quantity,
    ...(lineModifiers.length > 0 ? { line_modifiers: lineModifiers } : {}),
  };
}

export function buildReceiptPayment({
  paymentType,
  amount,
}: {
  paymentType: { id: string; loyverseId: string };
  amount: number;
}): ReceiptPayment {
  if (!paymentType.loyverseId) {
    throw new Error(`No Loyverse payment type found for "${paymentType.id}"`);
  }

  return {
    payment_type_id: paymentType.loyverseId,
    amount,
  };
}

export async function buildReceiptPayload(
  orderId: string
): Promise<ReceiptPayload> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          item: { include: { variants: true } },
          variant: true,
          modifiers: { include: { modifier: true } },
        },
      },
    },
  });

  if (!order) throw new Error("Order not found");

  const storeId = process.env.LOYVERSE_STORE_ID;
  if (!storeId) throw new Error("LOYVERSE_STORE_ID is not set");

  const lineItems: ReceiptLineItem[] = order.items.map((oi) =>
    buildReceiptLineItem({
      itemName: oi.item.name,
      quantity: oi.quantity,
      selectedVariantLoyverseId: oi.variant?.loyverseId,
      variants: oi.item.variants,
      modifiers: oi.modifiers.map((m) => m.modifier),
    })
  );

  return {
    store_id: storeId,
    order: `QR-${formatOrderDisplayNumber(order)} / Table ${order.tableCode}`,
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
  const paymentType = await prisma.paymentType.findUnique({
    where: { id: paymentTypeId },
    select: { id: true, loyverseId: true },
  });
  if (!paymentType) throw new Error("Payment type not found");

  payload.payments = [buildReceiptPayment({ paymentType, amount })];

  const response = await post<{ receipt_number: string }>(
    "/receipts",
    payload
  );

  return { receiptNumber: response.receipt_number };
}
