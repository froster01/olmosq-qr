import { createHmac, timingSafeEqual } from "node:crypto";

import { STAFF_SESSION_MAX_AGE_SECONDS } from "./constants";

type StaffJwtClaims = {
  sub: string;
  username: string;
  iat: number;
  exp: number;
};

export type StaffSessionPayload = {
  staffUserId: string;
  username: string;
  issuedAt: number;
  expiresAt: number;
};

export function signStaffJwt({
  staffUserId,
  username,
  secret,
  now = new Date(),
  maxAgeSeconds = STAFF_SESSION_MAX_AGE_SECONDS,
}: {
  staffUserId: string;
  username: string;
  secret: string;
  now?: Date;
  maxAgeSeconds?: number;
}) {
  const issuedAt = toUnixSeconds(now);
  const claims: StaffJwtClaims = {
    sub: staffUserId,
    username,
    iat: issuedAt,
    exp: issuedAt + maxAgeSeconds,
  };
  const header = encodeJson({ alg: "HS256", typ: "JWT" });
  const payload = encodeJson(claims);
  const signature = sign(`${header}.${payload}`, secret);

  return `${header}.${payload}.${signature}`;
}

export function verifyStaffJwt(
  token: string,
  {
    secret,
    now = new Date(),
  }: {
    secret: string;
    now?: Date;
  }
): StaffSessionPayload | null {
  const [header, payload, signature, extra] = token.split(".");
  if (!header || !payload || !signature || extra !== undefined) {
    return null;
  }

  const expectedSignature = sign(`${header}.${payload}`, secret);
  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  const claims = decodeClaims(payload);
  if (!claims || claims.exp <= toUnixSeconds(now)) {
    return null;
  }

  return {
    staffUserId: claims.sub,
    username: claims.username,
    issuedAt: claims.iat,
    expiresAt: claims.exp,
  };
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function encodeJson(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function decodeClaims(value: string): StaffJwtClaims | null {
  try {
    const claims = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (
      !claims ||
      typeof claims.sub !== "string" ||
      !claims.sub ||
      typeof claims.username !== "string" ||
      !claims.username ||
      !Number.isInteger(claims.iat) ||
      !Number.isInteger(claims.exp)
    ) {
      return null;
    }
    return claims;
  } catch {
    return null;
  }
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function toUnixSeconds(date: Date) {
  return Math.floor(date.getTime() / 1000);
}
