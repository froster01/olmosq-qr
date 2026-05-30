import assert from "node:assert/strict";
import test from "node:test";

import {
  parseOrderEventJobData,
  parseStaffNotificationJobData,
} from "./order-events";

test("parseOrderEventJobData accepts created and updated order jobs", () => {
  assert.deepEqual(parseOrderEventJobData({ kind: "order.created", orderId: "ord_1" }), {
    kind: "order.created",
    orderId: "ord_1",
  });
  assert.deepEqual(parseOrderEventJobData({ kind: "order.updated", orderId: "ord_2" }), {
    kind: "order.updated",
    orderId: "ord_2",
  });
});

test("parseOrderEventJobData rejects malformed order jobs", () => {
  assert.throws(
    () => parseOrderEventJobData({ kind: "order.deleted", orderId: "ord_1" }),
    /Invalid order event job/
  );
  assert.throws(
    () => parseOrderEventJobData({ kind: "order.created", orderId: "" }),
    /Invalid order event job/
  );
});

test("parseStaffNotificationJobData accepts new order notification jobs", () => {
  assert.deepEqual(
    parseStaffNotificationJobData({ kind: "staff.order.created", orderId: "ord_1" }),
    { kind: "staff.order.created", orderId: "ord_1" }
  );
});

test("parseStaffNotificationJobData rejects malformed staff notification jobs", () => {
  assert.throws(
    () => parseStaffNotificationJobData({ kind: "staff.order.updated", orderId: "ord_1" }),
    /Invalid staff notification job/
  );
});
