import assert from "node:assert/strict";
import test from "node:test";

import { findLatestClosedShift, findLatestOpenShift } from "./shifts";
import type { LoyverseShift } from "./types";

const baseShift = {
  id: "shift",
  store_id: "store",
  pos_device_id: "device",
  starting_cash: 100,
  cash_payments: 0,
  cash_refunds: 0,
  paid_in: 0,
  paid_out: 0,
  expected_cash: 100,
  actual_cash: null,
} satisfies Omit<LoyverseShift, "opened_at">;

test("findLatestOpenShift returns the newest shift without closed_at", () => {
  const latest = findLatestOpenShift([
    {
      ...baseShift,
      id: "closed",
      opened_at: "2026-05-28T01:00:00.000Z",
      closed_at: "2026-05-28T09:00:00.000Z",
    },
    {
      ...baseShift,
      id: "open-old",
      opened_at: "2026-05-27T18:00:00.000Z",
      closed_at: null,
    },
    {
      ...baseShift,
      id: "open-new",
      opened_at: "2026-05-28T10:00:00.000Z",
      closed_at: null,
    },
  ]);

  assert.equal(latest?.id, "open-new");
});

test("findLatestOpenShift returns null when no shift is open", () => {
  assert.equal(
    findLatestOpenShift([
      {
        ...baseShift,
        id: "closed",
        opened_at: "2026-05-28T01:00:00.000Z",
        closed_at: "2026-05-28T09:00:00.000Z",
      },
    ]),
    null
  );
});

test("findLatestClosedShift returns the newest shift with closed_at", () => {
  const latest = findLatestClosedShift([
    {
      ...baseShift,
      id: "older",
      opened_at: "2026-05-28T01:00:00.000Z",
      closed_at: "2026-05-28T09:00:00.000Z",
    },
    {
      ...baseShift,
      id: "open",
      opened_at: "2026-05-28T10:00:00.000Z",
      closed_at: null,
    },
    {
      ...baseShift,
      id: "newer",
      opened_at: "2026-05-28T11:00:00.000Z",
      closed_at: "2026-05-28T11:26:05.000Z",
    },
  ]);

  assert.equal(latest?.id, "newer");
});
