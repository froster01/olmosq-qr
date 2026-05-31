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
