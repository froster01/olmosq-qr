import assert from "node:assert/strict";
import { test } from "node:test";

import { summarizeShiftReport } from "./shift-report";

test("summarizeShiftReport totals only orders from the selected shift", () => {
  const report = summarizeShiftReport({
    shiftId: "shift-a",
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
  });

  assert.deepEqual(report, {
    orderCount: 2,
    grossSales: 14,
    cashSales: 14,
    cashReceived: 20,
    cashChange: 6,
    paymentTypeTotals: [{ name: "Cash", total: 14 }],
    statusCounts: [
      { status: "CANCELLED", count: 1 },
      { status: "DONE", count: 1 },
    ],
  });
});
