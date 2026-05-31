import assert from "node:assert/strict";
import test from "node:test";

import { serializeClosedShiftReportSummaries } from "./closed-shift-report-data";

test("serializeClosedShiftReportSummaries returns compact cached report rows", () => {
  const summaries = serializeClosedShiftReportSummaries([
    {
      id: "shift_1",
      shiftNumber: 7,
      openedAt: new Date("2026-05-30T02:00:00.000Z"),
      closedAt: new Date("2026-05-30T10:00:00.000Z"),
      startingCash: { toString: () => "100.00" },
      actualCash: { toString: () => "160.00" },
      orders: [
        {
          status: "DONE",
          total: { toString: () => "42.50" },
          cashReceived: { toString: () => "50.00" },
          cashChange: { toString: () => "7.50" },
          paymentType: { name: "Cash", type: "CASH" },
        },
        {
          status: "DONE",
          total: { toString: () => "19.00" },
          cashReceived: null,
          cashChange: null,
          paymentType: { name: "Card", type: "NONINTEGRATEDCARD" },
        },
      ],
      cashMovements: [
        { type: "CASH_IN", amount: { toString: () => "20.00" } },
        { type: "CASH_OUT", amount: { toString: () => "2.50" } },
      ],
    },
  ]);

  assert.deepEqual(summaries, [
    {
      id: "shift_1",
      shiftNumber: 7,
      openedAt: "2026-05-30T02:00:00.000Z",
      closedAt: "2026-05-30T10:00:00.000Z",
      actualCash: 160,
      expectedCash: 160,
      orderCount: 2,
      cashMovementCount: 2,
    },
  ]);
});
