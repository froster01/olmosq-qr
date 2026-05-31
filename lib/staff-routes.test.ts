import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

test("staff shift page is the canonical shift route", () => {
  assert.equal(
    existsSync(path.join(root, "app/(staff)/staff/(protected)/shift/page.tsx")),
    true
  );
  assert.equal(
    existsSync(
      path.join(root, "app/(staff)/staff/(protected)/cash-drawer/page.tsx")
    ),
    false
  );

  const filesWithStaffShiftLinks = [
    "components/staff/staff-nav-link.tsx",
    "app/actions/shifts.ts",
    "app/(staff)/staff/(protected)/shift-reports/page.tsx",
    "app/(staff)/staff/(protected)/shift-reports/[shiftId]/page.tsx",
  ];

  for (const file of filesWithStaffShiftLinks) {
    const content = readFileSync(path.join(root, file), "utf8");
    assert.doesNotMatch(content, /\/staff\/cash-drawer/, file);
  }
});

test("protected staff routes have navigation loading feedback", () => {
  assert.equal(
    existsSync(path.join(root, "app/(staff)/staff/(protected)/loading.tsx")),
    true
  );

  const staffNavLink = readFileSync(
    path.join(root, "components/staff/staff-nav-link.tsx"),
    "utf8"
  );

  assert.match(staffNavLink, /useLinkStatus/);
  assert.match(staffNavLink, /aria-hidden/);
});

test("orders page guards staff when no shift is open", () => {
  const ordersPage = readFileSync(
    path.join(root, "app/(staff)/staff/(protected)/orders/page.tsx"),
    "utf8"
  );
  const ordersClient = readFileSync(
    path.join(root, "app/(staff)/staff/(protected)/orders/orders-client.tsx"),
    "utf8"
  );
  const orderRealtimeData = readFileSync(
    path.join(root, "lib/orders/order-realtime-data.ts"),
    "utf8"
  );

  assert.match(
    ordersPage,
    /currentShift\s*\?\s*await getCurrentShiftOrderSummaries/
  );
  assert.match(ordersPage, /initialOrders=\{initialOrders\}/);
  assert.match(
    orderRealtimeData,
    /getCurrentShiftOrderSummaries\(shiftId\?: string\)/
  );
  assert.match(ordersClient, /if \(!currentShift\)/);
  assert.match(ordersClient, /href="\/staff\/shift"/);
  assert.match(ordersClient, /Open a shift before taking orders/);
  assert.match(ordersClient, /pointer-events-none/);
  assert.match(ordersClient, /blur/);
});

test("staff uses web push alerts without in-page notification sound", () => {
  assert.equal(
    existsSync(
      path.join(root, "components/staff/staff-notification-sound-toggle.tsx")
    ),
    false
  );
  assert.equal(
    existsSync(path.join(root, "lib/notifications/staff-notification-sound.ts")),
    false
  );
  assert.equal(existsSync(path.join(root, "public/sounds/new-order.mp3")), false);
  assert.equal(
    existsSync(path.join(root, "components/staff/staff-push-alerts.tsx")),
    true
  );
  assert.equal(
    existsSync(
      path.join(root, "app/(staff)/staff/(protected)/push-subscriptions/route.ts")
    ),
    true
  );
  assert.equal(existsSync(path.join(root, "public/staff-push-sw.js")), true);

  const staffLayout = readFileSync(
    path.join(root, "app/(staff)/staff/(protected)/layout.tsx"),
    "utf8"
  );
  const ordersClient = readFileSync(
    path.join(root, "app/(staff)/staff/(protected)/orders/orders-client.tsx"),
    "utf8"
  );
  const orderQueues = readFileSync(
    path.join(root, "lib/realtime/order-queues.ts"),
    "utf8"
  );
  const ordersAction = readFileSync(
    path.join(root, "app/actions/orders.ts"),
    "utf8"
  );
  const pushAlerts = readFileSync(
    path.join(root, "components/staff/staff-push-alerts.tsx"),
    "utf8"
  );
  const staffNotifications = readFileSync(
    path.join(root, "lib/realtime/staff-notification-processor.ts"),
    "utf8"
  );

  assert.match(staffLayout, /StaffPushAlerts/);
  assert.doesNotMatch(staffLayout, /StaffNotificationSoundToggle/);
  assert.doesNotMatch(ordersClient, /staff-notification-sound/);
  assert.doesNotMatch(ordersClient, /getStaffNotificationSound/);
  assert.doesNotMatch(ordersClient, /shouldPlayStaffNotificationSound/);
  assert.match(orderQueues, /STAFF_NOTIFICATIONS_QUEUE/);
  assert.match(ordersAction, /enqueueStaffOrderCreatedNotification/);
  assert.match(pushAlerts, /Push alerts/);
  assert.doesNotMatch(staffNotifications, /isStaffOrdersPageActive/);
});

test("staff logout button submits the logout form", () => {
  const staffLayout = readFileSync(
    path.join(root, "app/(staff)/staff/(protected)/layout.tsx"),
    "utf8"
  );

  assert.match(staffLayout, /<form[\s\S]*action=\{logoutStaffAction\}/);
  assert.match(staffLayout, /type="submit"/);
});
