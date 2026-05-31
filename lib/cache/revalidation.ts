import { revalidatePath, revalidateTag } from "next/cache";

export const CUSTOMER_MENU_CACHE_TAG = "customer-menu";
export const STAFF_MENU_SETTINGS_CACHE_TAG = "staff-menu-settings";
export const STAFF_TABLES_CACHE_TAG = "staff-tables";
export const CLOSED_SHIFT_REPORT_CACHE_TAG = "closed-shift-reports";

function expireTag(tag: string) {
  revalidateTag(tag, { expire: 0 });
}

export function revalidateCustomerMenuData() {
  expireTag(CUSTOMER_MENU_CACHE_TAG);
  revalidatePath("/table/[tableCode]", "page");
}

export function revalidateStaffMenuSettingsData() {
  expireTag(STAFF_MENU_SETTINGS_CACHE_TAG);
  revalidatePath("/staff/menu-settings");
}

export function revalidateMenuData() {
  revalidateCustomerMenuData();
  revalidateStaffMenuSettingsData();
}

export function revalidateTableData() {
  expireTag(STAFF_TABLES_CACHE_TAG);
  revalidatePath("/staff/tables");
  revalidatePath("/table/[tableCode]", "page");
}

export function revalidateClosedShiftReportData() {
  expireTag(CLOSED_SHIFT_REPORT_CACHE_TAG);
  revalidatePath("/staff/shift-reports");
  revalidatePath("/staff/shift-reports/[shiftId]", "page");
}
