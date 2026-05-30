export const STAFF_ORDER_FALLBACK_REFRESH_MS = 15_000;
export const CUSTOMER_ORDER_FALLBACK_REFRESH_MS = 5_000;

export function getOrderFallbackRefreshInterval(input: {
  scope: "staff";
  isFinal: boolean;
}): typeof STAFF_ORDER_FALLBACK_REFRESH_MS;
export function getOrderFallbackRefreshInterval(input: {
  scope: "customer";
  isFinal: boolean;
}): typeof CUSTOMER_ORDER_FALLBACK_REFRESH_MS | null;
export function getOrderFallbackRefreshInterval({
  scope,
  isFinal,
}: {
  scope: "staff" | "customer";
  isFinal: boolean;
}) {
  if (scope === "customer" && isFinal) {
    return null;
  }

  return scope === "staff"
    ? STAFF_ORDER_FALLBACK_REFRESH_MS
    : CUSTOMER_ORDER_FALLBACK_REFRESH_MS;
}
