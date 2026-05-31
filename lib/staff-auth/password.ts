import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const keyLength = 64;
const hashPrefix = "scrypt";

export async function hashStaffPassword(
  password: string,
  salt = randomBytes(16).toString("base64url")
) {
  const key = (await scryptAsync(password, salt, keyLength)) as Buffer;
  return `${hashPrefix}$${salt}$${key.toString("base64url")}`;
}

export async function verifyStaffPassword(password: string, passwordHash: string) {
  const [prefix, salt, storedKey] = passwordHash.split("$");
  if (prefix !== hashPrefix || !salt || !storedKey) {
    return false;
  }

  const key = (await scryptAsync(password, salt, keyLength)) as Buffer;
  const stored = Buffer.from(storedKey, "base64url");

  return stored.length === key.length && timingSafeEqual(stored, key);
}
