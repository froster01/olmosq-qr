import { prisma } from "@/lib/db";
import { generateQRCodeDataURL, getTableURL } from "@/lib/qr-code";
import { TablesPageClient } from "./tables-client";

export const dynamic = "force-dynamic";

export default async function TablesPage() {
  const tables = await prisma.table.findMany({
    orderBy: { number: "asc" },
  });

  const tablesWithQR = await Promise.all(
    tables.map(async (table) => {
      const url = getTableURL(table.code);
      const qrDataUrl = await generateQRCodeDataURL(url);
      return {
        code: table.code,
        number: table.number,
        name: table.name,
        isActive: table.isActive,
        orderingUrl: url,
        qrDataUrl,
      };
    })
  );

  return <TablesPageClient tables={tablesWithQR} />;
}
