import { unstable_cache } from "next/cache";

import { STAFF_TABLES_CACHE_TAG } from "@/lib/cache/revalidation";

export type StaffTablePageData = {
  code: string;
  number: number;
  name: string | null;
  isActive: boolean;
  orderingUrl: string;
  qrDataUrl: string;
};

export const getCachedStaffTablePageData = unstable_cache(
  async (): Promise<StaffTablePageData[]> => {
    const [{ prisma }, { generateQRCodeDataURL, getTableURL }] =
      await Promise.all([import("@/lib/db"), import("@/lib/qr-code")]);

    const tables = await prisma.table.findMany({
      orderBy: { number: "asc" },
    });

    return Promise.all(
      tables.map(async (table) => {
        const url = getTableURL(table.code);
        return {
          code: table.code,
          number: table.number,
          name: table.name,
          isActive: table.isActive,
          orderingUrl: url,
          qrDataUrl: await generateQRCodeDataURL(url),
        };
      })
    );
  },
  ["staff-table-page"],
  { tags: [STAFF_TABLES_CACHE_TAG] }
);
