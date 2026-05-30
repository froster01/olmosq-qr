"use client";

export function buildOrderWebSocketUrl(params: Record<string, string>) {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const url = new URL("/ws/orders", `${protocol}//${window.location.host}`);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}
