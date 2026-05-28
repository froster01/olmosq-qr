import assert from "node:assert/strict";
import { test } from "node:test";

import { summarizeShiftReport } from "./shift-report";

test("summarizeShiftReport totals only orders from the selected shift", () => {
  const report = summarizeShiftReport({
    shiftId: "shift-a",
    startingCash: 100,
    actualCash: 120,
    orders: [
      {
        shiftId: "shift-a",
        status: "DONE",
        total: 14,
        cashReceived: 20,
        cashChange: 6,
        paymentType: { name: "Cash", type: "CASH" },
      },
      {
        shiftId: "shift-a",
        status: "CANCELLED",
        total: 8,
        cashReceived: null,
        cashChange: null,
        paymentType: null,
      },
      {
        shiftId: "shift-b",
        status: "DONE",
        total: 99,
        cashReceived: 100,
        cashChange: 1,
        paymentType: { name: "Cash", type: "CASH" },
      },
    ],
    movements: [
      { shiftId: "shift-a", type: "CASH_IN", amount: 10 },
      { shiftId: "shift-a", type: "CASH_OUT", amount: 4 },
      { shiftId: "shift-b", type: "CASH_IN", amount: 999 },
    ],
  });

  assert.deepEqual(report, {
    orderCount: 2,
    grossSales: 14,
    startingCash: 100,
    cashSales: 14,
    cashReceived: 20,
    cashChange: 6,
    cashIn: 10,
    cashOut: 4,
    expectedCash: 120,
    actualCash: 120,
    cashVariance: 0,
    paymentTypeTotals: [{ name: "Cash", total: 14 }],
    statusCounts: [
      { status: "CANCELLED", count: 1 },
      { status: "DONE", count: 1 },
    ],
  });
});
