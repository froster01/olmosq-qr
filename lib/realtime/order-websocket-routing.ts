import type { OrderRealtimeEvent } from "@/lib/realtime/order-events";

export type OrderSocketSubscription =
  | { scope: "staff" }
  | { scope: "customer"; orderId: string };

type ParseOrderSocketSubscriptionOptions = {
  isStaffAuthenticated?: boolean;
};

export function parseOrderSocketSubscription(
  url: URL,
  options: ParseOrderSocketSubscriptionOptions = {}
): OrderSocketSubscription | null {
  const scope = url.searchParams.get("scope");

  if (scope === "staff") {
    if (!options.isStaffAuthenticated) {
      return null;
    }
    return { scope };
  }

  if (scope === "customer") {
    const orderId = url.searchParams.get("orderId")?.trim();
    if (!orderId) {
      return null;
    }
    return { scope, orderId };
  }

  return null;
}

export function shouldSendEventToSubscription(
  subscription: OrderSocketSubscription,
  event: OrderRealtimeEvent
) {
  return (
    subscription.scope === "staff" ||
    subscription.orderId === event.orderId
  );
}
