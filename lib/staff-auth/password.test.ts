import assert from "node:assert/strict";
import test from "node:test";

import { hashStaffPassword, verifyStaffPassword } from "./password";

test("verifyStaffPassword accepts the original password", async () => {
  const hash = await hashStaffPassword("counter-secret", "fixed-salt");

  assert.equal(await verifyStaffPassword("counter-secret", hash), true);
});

test("verifyStaffPassword rejects a different password", async () => {
  const hash = await hashStaffPassword("counter-secret", "fixed-salt");

  assert.equal(await verifyStaffPassword("wrong-secret", hash), false);
});
