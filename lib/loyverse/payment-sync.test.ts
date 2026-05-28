import assert from "node:assert/strict";
import test from "node:test";

import { mapLoyversePaymentTypeForUpsert } from "./payment-sync";

test("mapLoyversePaymentTypeForUpsert keeps Loyverse payment type", () => {
  assert.deepEqual(
    mapLoyversePaymentTypeForUpsert({
      id: "loyverse-cash-id",
      name: "Cash",
      type: "CASH",
      stores: ["store-1"],
      created_at: "2026-05-28T10:00:00.000Z",
      updated_at: "2026-05-28T10:00:00.000Z",
      deleted_at: null,
    }),
    {
      loyverseId: "loyverse-cash-id",
      name: "Cash",
      type: "CASH",
    }
  );
});
