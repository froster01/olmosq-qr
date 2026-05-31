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
