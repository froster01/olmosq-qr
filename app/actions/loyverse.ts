"use server";

import { syncFullMenu } from "@/lib/loyverse/menu-sync";
import { syncPaymentTypes } from "@/lib/loyverse/payment-sync";
import { createLoyverseReceipt } from "@/lib/loyverse/receipt-builder";
import { prisma } from "@/lib/db";
import {
  getPaidOrderStatus,
  getReceiptSyncFailedOrderStatus,
} from "@/lib/orders/status-flow";
import { validateCashPayment } from "@/lib/payments/cash-drawer";
import { getCurrentShift } from "@/lib/shifts/current-shift";

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
  paymentTypeId: string,
  cashReceived?: number
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });
  if (!order) return { success: false, error: "Order not found" };

  const openShift = await getCurrentShift();
  if (!openShift || order.shiftId !== openShift.id) {
    return {
      success: false,
      error: "This order belongs to a closed shift and cannot be paid.",
    };
  }

  const paymentType = await prisma.paymentType.findUnique({
    where: { id: paymentTypeId },
    select: { id: true, name: true, type: true },
  });
  if (!paymentType) return { success: false, error: "Payment type not found" };

  let cashPayment: { cashReceived: number | null; cashChange: number | null };
  try {
    cashPayment = validateCashPayment({
      paymentType,
      total: Number(order.total),
      cashReceived:
        cashReceived ??
        (order.cashReceived === null ? undefined : Number(order.cashReceived)),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }

  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "PAID_SYNCING" },
    });

    const { receiptNumber } = await createLoyverseReceipt(
      orderId,
      paymentTypeId,
      Number(order.total)
    );

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: getPaidOrderStatus(),
        loyverseReceiptNumber: receiptNumber,
        paymentTypeId,
        paidAt: new Date(),
        cashReceived: cashPayment.cashReceived,
        cashChange: cashPayment.cashChange,
        loyverseSyncError: null,
      },
    });

    await prisma.loyverseSyncLog.create({
      data: {
        orderId,
        action: "CREATE_RECEIPT",
        status: "success",
        responseData: JSON.stringify({
          receiptNumber,
          cashPayment,
        }),
      },
    });

    return { success: true, data: { receiptNumber, cashPayment } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: getReceiptSyncFailedOrderStatus(),
        loyverseSyncError: message,
        paymentTypeId,
        paidAt: new Date(),
        cashReceived: cashPayment.cashReceived,
        cashChange: cashPayment.cashChange,
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
  return createReceiptAction(
    orderId,
    order.paymentTypeId,
    order.cashReceived === null ? undefined : Number(order.cashReceived)
  );
}
