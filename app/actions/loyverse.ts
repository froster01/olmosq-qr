"use server";

import { syncFullMenu } from "@/lib/loyverse/menu-sync";
import { syncPaymentTypes } from "@/lib/loyverse/payment-sync";
import { createLoyverseReceipt } from "@/lib/loyverse/receipt-builder";
import { prisma } from "@/lib/db";
import { revalidateMenuData } from "@/lib/cache/revalidation";
import {
  getPaidOrderStatus,
  getReceiptSyncFailedOrderStatus,
} from "@/lib/orders/status-flow";
import { validateCashPayment } from "@/lib/payments/cash-drawer";
import { enqueueOrderUpdatedEvent } from "@/lib/realtime/order-queues";
import { getCurrentShift } from "@/lib/shifts/current-shift";
import { getUnauthorizedStaffActionResult } from "@/lib/staff-auth/guards";

export async function syncMenuAction() {
  const unauthorized = await getUnauthorizedStaffActionResult();
  if (unauthorized) return unauthorized;

  try {
    const result = await syncFullMenu();
    revalidateMenuData();
    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function syncPaymentTypesAction() {
  const unauthorized = await getUnauthorizedStaffActionResult();
  if (unauthorized) return unauthorized;

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
  const unauthorized = await getUnauthorizedStaffActionResult();
  if (unauthorized) return unauthorized;

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
    await enqueueOrderUpdate(orderId);

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
    await enqueueOrderUpdate(orderId);

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
    await enqueueOrderUpdate(orderId);

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

async function enqueueOrderUpdate(orderId: string) {
  try {
    await enqueueOrderUpdatedEvent(orderId);
  } catch (error) {
    console.error("Failed to enqueue order update", error);
  }
}

export async function retryReceiptAction(orderId: string) {
  const unauthorized = await getUnauthorizedStaffActionResult();
  if (unauthorized) return unauthorized;

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

export async function resetMenuAction() {
  const unauthorized = await getUnauthorizedStaffActionResult();
  if (unauthorized) return unauthorized;

  try {
    // Delete in correct order to respect foreign key constraints:
    // 1. OrderItems (depend on Item and Variant)
    // 2. ItemModifiers (depend on Item)
    // 3. Variants (depend on Item)
    // 4. Items (depend on Category)
    // 5. Categories

    const deletedOrderItems = await prisma.orderItem.deleteMany({});
    const deletedModifiers = await prisma.itemModifier.deleteMany({});
    const deletedVariants = await prisma.variant.deleteMany({});
    const deletedItems = await prisma.item.deleteMany({});
    const deletedCategories = await prisma.category.deleteMany({});

    const totalDeleted =
      deletedItems.count + deletedCategories.count + deletedVariants.count + deletedModifiers.count + deletedOrderItems.count;

    revalidateMenuData();

    return { success: true, data: { deleted: totalDeleted } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function resetPaymentTypesAction() {
  const unauthorized = await getUnauthorizedStaffActionResult();
  if (unauthorized) return unauthorized;

  try {
    // Clear paymentTypeId from orders that reference payment types
    await prisma.order.updateMany({
      where: {
        paymentTypeId: {
          not: null,
        },
      },
      data: {
        paymentTypeId: null,
      },
    });

    // Now delete all payment types
    const deletedPaymentTypes = await prisma.paymentType.deleteMany({});
    return { success: true, data: { deleted: deletedPaymentTypes.count } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}
