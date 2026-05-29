import assert from "node:assert/strict";
import { test } from "node:test";

import { getCustomerTrackingState } from "./customer-tracking";

test("awaiting-payment orders keep customers on the payment step", () => {
  const tracking = getCustomerTrackingState("AWAITING_PAYMENT");

  assert.equal(tracking.headline, "Pay at counter");
  assert.equal(tracking.signal, "Waiting for cashier");
  assert.deepEqual(
    tracking.steps.map((step) => step.state),
    ["active", "pending", "pending"]
  );
});

test("preparing orders complete payment and activate preparation", () => {
  const tracking = getCustomerTrackingState("PREPARING");

  assert.equal(tracking.headline, "Preparing now");
  assert.deepEqual(
    tracking.steps.map((step) => step.state),
    ["complete", "active", "pending"]
  );
});

test("done orders complete the full customer timeline", () => {
  const tracking = getCustomerTrackingState("DONE");

  assert.equal(tracking.headline, "Order ready");
  assert.equal(tracking.isFinal, true);
  assert.deepEqual(
    tracking.steps.map((step) => step.state),
    ["complete", "complete", "complete"]
  );
});

test("cancelled orders stop the customer timeline", () => {
  const tracking = getCustomerTrackingState("CANCELLED");

  assert.equal(tracking.headline, "Order cancelled");
  assert.equal(tracking.isCancelled, true);
  assert.deepEqual(
    tracking.steps.map((step) => step.state),
    ["active", "pending", "pending"]
  );
});
