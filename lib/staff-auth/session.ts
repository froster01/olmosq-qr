import "server-only";

import { cookies } from "next/headers";

import {
  STAFF_SESSION_COOKIE_NAME,
  STAFF_SESSION_MAX_AGE_SECONDS,
} from "./constants";
import { signStaffJwt, verifyStaffJwt } from "./jwt";

export function getStaffJwtSecret() {
  const secret = process.env.STAFF_JWT_SECRET?.trim();
  if (!secret) {
    throw new Error("STAFF_JWT_SECRET is not configured");
  }
  return secret;
}

export async function getStaffSession() {
  const token = (await cookies()).get(STAFF_SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const secret = process.env.STAFF_JWT_SECRET?.trim();
  if (!secret) {
    return null;
  }

  return verifyStaffJwt(token, { secret });
}

export async function setStaffSessionCookie({
  staffUserId,
  username,
}: {
  staffUserId: string;
  username: string;
}) {
  const token = signStaffJwt({
    staffUserId,
    username,
    secret: getStaffJwtSecret(),
  });

  (await cookies()).set(STAFF_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: STAFF_SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearStaffSessionCookie() {
  (await cookies()).delete(STAFF_SESSION_COOKIE_NAME);
}
