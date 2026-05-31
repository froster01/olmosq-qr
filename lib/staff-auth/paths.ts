export function getSafeStaffNextPath(value: FormDataEntryValue | string | null) {
  const next = typeof value === "string" ? value.trim() : "";
  if (
    !next ||
    !next.startsWith("/staff") ||
    next.startsWith("//") ||
    next.startsWith("/staff/login")
  ) {
    return "/staff/orders";
  }
  return next;
}
