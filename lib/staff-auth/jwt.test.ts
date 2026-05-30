import assert from "node:assert/strict";
import test from "node:test";

import { signStaffJwt, verifyStaffJwt } from "./jwt";

const secret = "test-secret-with-enough-length";
const now = new Date("2026-05-30T10:00:00.000Z");

test("verifyStaffJwt accepts a signed staff token", () => {
  const token = signStaffJwt({
    staffUserId: "staff_1",
    username: "staff",
    secret,
    now,
    maxAgeSeconds: 60,
  });

  assert.deepEqual(
    verifyStaffJwt(token, {
      secret,
      now: new Date("2026-05-30T10:00:30.000Z"),
    }),
    {
      staffUserId: "staff_1",
      username: "staff",
      issuedAt: 1780135200,
      expiresAt: 1780135260,
    }
  );
});

test("verifyStaffJwt rejects a tampered token", () => {
  const token = signStaffJwt({
    staffUserId: "staff_1",
    username: "staff",
    secret,
    now,
    maxAgeSeconds: 60,
  });
  const tampered = token.replace(/.$/, token.endsWith("a") ? "b" : "a");

  assert.equal(verifyStaffJwt(tampered, { secret, now }), null);
});

test("verifyStaffJwt rejects an expired token", () => {
  const token = signStaffJwt({
    staffUserId: "staff_1",
    username: "staff",
    secret,
    now,
    maxAgeSeconds: 60,
  });

  assert.equal(
    verifyStaffJwt(token, {
      secret,
      now: new Date("2026-05-30T10:01:01.000Z"),
    }),
    null
  );
});
