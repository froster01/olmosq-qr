import { prisma } from "@/lib/db";
import { getCurrentShift } from "@/lib/shifts/current-shift";
import { notFound } from "next/navigation";
import { OrderingPageClient } from "./ordering-client";
import { BrandMark } from "@/components/brand-mark";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

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

  const openShift = await getCurrentShift();
  if (!openShift) {
    return <ShopClosed tableNumber={table.number} />;
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

function ShopClosed({ tableNumber }: { tableNumber: number }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-5">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-5 p-6 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-accent/45 text-primary">
            <Clock className="h-8 w-8" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <BrandMark className="size-8" />
            <span className="font-heading text-lg font-bold text-primary">
              Olmosq Coffee
            </span>
          </div>
          <div className="space-y-2">
            <h1 className="font-heading text-3xl font-bold">
              Shop currently closed
            </h1>
            <p className="text-sm text-muted-foreground">
              Table {tableNumber} ordering will be available again when staff
              opens the next shift.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
