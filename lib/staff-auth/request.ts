import { STAFF_SESSION_COOKIE_NAME } from "./constants";
import { verifyStaffJwt } from "./jwt";

export function isStaffCookieHeaderAuthenticated(
  cookieHeader: string | string[] | undefined
) {
  const secret = process.env.STAFF_JWT_SECRET?.trim();
  if (!secret) {
    return false;
  }

  const token = getCookieValue(cookieHeader, STAFF_SESSION_COOKIE_NAME);
  return token ? verifyStaffJwt(token, { secret }) !== null : false;
}

function getCookieValue(
  cookieHeader: string | string[] | undefined,
  name: string
) {
  const header = Array.isArray(cookieHeader)
    ? cookieHeader.join("; ")
    : cookieHeader;
  if (!header) {
    return null;
  }

  for (const cookie of header.split(";")) {
    const [rawKey, ...rawValue] = cookie.trim().split("=");
    if (rawKey === name) {
      return decodeURIComponent(rawValue.join("="));
    }
  }

  return null;
}
