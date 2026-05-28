import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateCashDrawerTotals,
  isCashPaymentType,
  summarizeCashDrawer,
  validateCashPayment,
} from "./cash-drawer";

test("isCashPaymentType uses the Loyverse payment type instead of the name", () => {
  assert.equal(isCashPaymentType({ name: "Cash", type: "CASH" }), true);
  assert.equal(isCashPaymentType({ name: "Cash-ish QR", type: "OTHER" }), false);
});

test("validateCashPayment requires enough cash for CASH payments", () => {
  assert.deepEqual(
    validateCashPayment({
      paymentType: { name: "Cash", type: "CASH" },
      total: 14,
      cashReceived: 20,
    }),
    { cashReceived: 20, cashChange: 6 }
  );

  assert.throws(
    () =>
      validateCashPayment({
        paymentType: { name: "Cash", type: "CASH" },
        total: 14,
        cashReceived: 10,
      }),
    /Cash received is short by RM 4\.00/
  );
});

test("validateCashPayment ignores cash fields for non-cash payments", () => {
  assert.deepEqual(
    validateCashPayment({
      paymentType: { name: "QR", type: "OTHER" },
      total: 14,
      cashReceived: 20,
    }),
    { cashReceived: null, cashChange: null }
  );
});

test("summarizeCashDrawer totals only cash payment orders", () => {
  const summary = summarizeCashDrawer([
    {
      total: 14,
      cashReceived: 20,
      cashChange: 6,
      paymentType: { type: "CASH", name: "Cash" },
    },
    {
      total: 18,
      cashReceived: 18,
      cashChange: 0,
      paymentType: { type: "NONINTEGRATEDCARD", name: "Card" },
    },
    {
      total: 7.5,
      cashReceived: 10,
      cashChange: 2.5,
      paymentType: { type: "CASH", name: "Cash" },
    },
  ]);

  assert.deepEqual(summary, {
    orderCount: 2,
    salesTotal: 21.5,
    cashReceivedTotal: 30,
    changeGivenTotal: 8.5,
    expectedCashImpact: 21.5,
  });
});

test("calculateCashDrawerTotals includes starting cash and manual movements", () => {
  const totals = calculateCashDrawerTotals({
    startingCash: 100,
    orders: [
      {
        total: 14,
        cashReceived: 20,
        cashChange: 6,
        paymentType: { type: "CASH", name: "Cash" },
      },
      {
        total: 18,
        paymentType: { type: "NONINTEGRATEDCARD", name: "Card" },
      },
    ],
    movements: [
      { type: "CASH_IN", amount: 50 },
      { type: "CASH_OUT", amount: 12.5 },
    ],
  });

  assert.deepEqual(totals, {
    orderCount: 1,
    startingCash: 100,
    salesTotal: 14,
    cashReceivedTotal: 20,
    changeGivenTotal: 6,
    expectedCashImpact: 14,
    cashInTotal: 50,
    cashOutTotal: 12.5,
    expectedCash: 151.5,
  });
});
