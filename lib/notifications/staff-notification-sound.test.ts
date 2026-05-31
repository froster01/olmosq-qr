import assert from "node:assert/strict";
import test from "node:test";

import {
  shouldPlayStaffFallbackPush,
  shouldPlayStaffNotificationSound,
} from "./staff-notification-sound";

test("staff notification sound plays for enabled created order events", () => {
  assert.equal(
    shouldPlayStaffNotificationSound({
      enabled: true,
      hasOpenShift: true,
      eventKind: "order.created",
    }),
    true
  );
});

test("staff notification sound does not play when disabled", () => {
  assert.equal(
    shouldPlayStaffNotificationSound({
      enabled: false,
      hasOpenShift: true,
      eventKind: "order.created",
    }),
    false
  );
});

test("staff notification sound ignores order updates and closed shifts", () => {
  assert.equal(
    shouldPlayStaffNotificationSound({
      enabled: true,
      hasOpenShift: true,
      eventKind: "order.updated",
    }),
    false
  );
  assert.equal(
    shouldPlayStaffNotificationSound({
      enabled: true,
      hasOpenShift: false,
      eventKind: "order.created",
    }),
    false
  );
});

test("staff fallback push sends only when staff orders page is inactive", () => {
  assert.equal(
    shouldPlayStaffFallbackPush({ hasActiveStaffOrdersPage: false }),
    true
  );
  assert.equal(
    shouldPlayStaffFallbackPush({ hasActiveStaffOrdersPage: true }),
    false
  );
});
