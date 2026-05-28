"use server";

import { syncFullMenu } from "@/lib/loyverse/menu-sync";
import { syncPaymentTypes } from "@/lib/loyverse/payment-sync";
import { createLoyverseReceipt } from "@/lib/loyverse/receipt-builder";
import { prisma } from "@/lib/db";

export async function syncMenuAction() {
  try {
    const result = await syncFullMenu();
    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function syncPaymentTypesAction() {
  try {
    const count = await syncPaymentTypes();
    return { success: true, data: { paymentTypes: count } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function createReceiptAction(
  orderId: string,
  paymentTypeId: string
) {
  try {
    // Update status to syncing
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "PAID_SYNCING" },
    });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new Error("Order not found");

    const { receiptNumber } = await createLoyverseReceipt(
      orderId,
      paymentTypeId,
      Number(order.total)
    );

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "PAID_SYNCED_TO_LOYVERSE",
        loyverseReceiptNumber: receiptNumber,
        paymentTypeId,
        loyverseSyncError: null,
      },
    });

    await prisma.loyverseSyncLog.create({
      data: {
        orderId,
        action: "CREATE_RECEIPT",
        status: "success",
        responseData: JSON.stringify({ receiptNumber }),
      },
    });

    return { success: true, data: { receiptNumber } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "PAID_SYNC_FAILED",
        loyverseSyncError: message,
      },
    });

    await prisma.loyverseSyncLog.create({
      data: {
        orderId,
        action: "CREATE_RECEIPT",
        status: "error",
        errorMessage: message,
      },
    });

    return { success: false, error: message };
  }
}

export async function retryReceiptAction(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });
  if (!order || !order.paymentTypeId) {
    return { success: false, error: "Order or payment type not found" };
  }
  return createReceiptAction(orderId, order.paymentTypeId);
}
