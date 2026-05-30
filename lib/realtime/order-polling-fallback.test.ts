import assert from "node:assert/strict";
import test from "node:test";

import {
  CUSTOMER_ORDER_FALLBACK_REFRESH_MS,
  STAFF_ORDER_FALLBACK_REFRESH_MS,
  getOrderFallbackRefreshInterval,
} from "./order-polling-fallback";

test("staff orders keep an HTTP fallback refresh while websocket is connected", () => {
  assert.equal(
    getOrderFallbackRefreshInterval({ scope: "staff", isFinal: false }),
    STAFF_ORDER_FALLBACK_REFRESH_MS
  );
});

test("customer tracker keeps polling until the order reaches a final state", () => {
  assert.equal(
    getOrderFallbackRefreshInterval({ scope: "customer", isFinal: false }),
    CUSTOMER_ORDER_FALLBACK_REFRESH_MS
  );
  assert.equal(
    getOrderFallbackRefreshInterval({ scope: "customer", isFinal: true }),
    null
  );
});
