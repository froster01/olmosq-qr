import { prisma } from "@/lib/db";
import { MenuSettingsClient } from "./menu-settings-client";

export const dynamic = "force-dynamic";

export default async function MenuSettingsPage() {
  const categories = await prisma.category.findMany({
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

  return <MenuSettingsClient categories={categories} />;
}
