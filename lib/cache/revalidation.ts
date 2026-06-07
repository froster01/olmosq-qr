import { revalidatePath, revalidateTag } from "next/cache";

export const CUSTOMER_MENU_CACHE_TAG = "customer-menu";

function expireTag(tag: string) {
  revalidateTag(tag, { expire: 0 });
}

export function revalidateCustomerMenuData() {
  expireTag(CUSTOMER_MENU_CACHE_TAG);
  revalidatePath("/table/[tableCode]", "page");
}
