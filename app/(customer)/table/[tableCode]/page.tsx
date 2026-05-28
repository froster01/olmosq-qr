import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { OrderingPageClient } from "./ordering-client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ tableCode: string }>;
}

export default async function TableOrderingPage({ params }: PageProps) {
  const { tableCode } = await params;

  const table = await prisma.table.findUnique({
    where: { code: tableCode },
  });

  if (!table || !table.isActive) {
    notFound();
  }

  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      items: {
        where: { isAvailable: true },
        orderBy: { name: "asc" },
        include: {
          variants: { orderBy: { sortOrder: "asc" } },
          modifiers: true,
        },
      },
    },
  });

  // Filter out categories with no available items
  const filteredCategories = categories.filter(
    (cat) => cat.items.length > 0
  );

  return (
    <OrderingPageClient
      tableCode={tableCode}
      tableNumber={table.number}
      categories={JSON.parse(JSON.stringify(filteredCategories))}
    />
  );
}
