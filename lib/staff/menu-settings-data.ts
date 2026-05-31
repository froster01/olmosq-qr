import { unstable_cache } from "next/cache";

import { STAFF_MENU_SETTINGS_CACHE_TAG } from "@/lib/cache/revalidation";

export type MenuSettingsCategory = {
  id: string;
  name: string;
  sortOrder: number;
  asksTemperature: boolean;
  isVisibleInMenu: boolean;
  _count: { items: number };
};

export const getCachedMenuSettingsCategories = unstable_cache(
  async (): Promise<MenuSettingsCategory[]> => {
    const { prisma } = await import("@/lib/db");

    return prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        sortOrder: true,
        asksTemperature: true,
        isVisibleInMenu: true,
        _count: { select: { items: true } },
      },
    });
  },
  ["staff-menu-settings"],
  { tags: [STAFF_MENU_SETTINGS_CACHE_TAG] }
);
