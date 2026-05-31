import { getCachedMenuSettingsCategories } from "@/lib/staff/menu-settings-data";
import { MenuSettingsClient } from "./menu-settings-client";

export const dynamic = "force-dynamic";

export default async function MenuSettingsPage() {
  const categories = await getCachedMenuSettingsCategories();

  return <MenuSettingsClient categories={categories} />;
}
