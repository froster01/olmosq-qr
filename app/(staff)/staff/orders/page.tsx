import { getCurrentShiftOrderSummaries } from "@/lib/orders/order-realtime-data";
import { getCurrentShift } from "@/lib/shifts/current-shift";
import { OrdersPageClient } from "./orders-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OrdersPage() {
  const currentShift = await getCurrentShift();

  return (
    <OrdersPageClient
      initialOrders={await getCurrentShiftOrderSummaries()}
      currentShift={
        currentShift
          ? {
              id: currentShift.id,
              shiftNumber: currentShift.shiftNumber,
              openedAt: currentShift.openedAt.toISOString(),
            }
          : null
      }
    />
  );
}
