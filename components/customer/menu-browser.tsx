"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MenuItemCard } from "./menu-item-card";
import { ItemDetailDialog } from "./item-detail-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { Item, Variant, ItemModifier, Category } from "@prisma/client";

type ItemWithRelations = Item & {
  variants: Variant[];
  modifiers: ItemModifier[];
};

type CategoryWithItems = Category & {
  items: ItemWithRelations[];
};

interface MenuBrowserProps {
  categories: CategoryWithItems[];
  loading?: boolean;
}

export function MenuBrowser({ categories, loading }: MenuBrowserProps) {
  const [selectedItem, setSelectedItem] = useState<ItemWithRelations | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  function handleSelectItem(item: ItemWithRelations) {
    setSelectedItem(item);
    setDialogOpen(true);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No menu items available yet.
      </div>
    );
  }

  return (
    <>
      <Tabs
        defaultValue={categories[0]?.id}
        className="customer-menu-tabs w-full"
      >
        <div className="customer-category-shell">
          <TabsList
            variant="line"
            className="customer-category-list scrollbar-hide"
          >
            {categories.map((cat) => (
              <TabsTrigger
                key={cat.id}
                value={cat.id}
                className="customer-category-trigger touch-manipulation"
              >
                {cat.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {categories.map((cat) => (
          <TabsContent key={cat.id} value={cat.id} className="mt-4">
            <div className="customer-menu-grid grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {cat.items
                .filter((item) => item.isAvailable)
                .map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onSelect={handleSelectItem}
                  />
                ))}
            </div>
            {cat.items.filter((i) => i.isAvailable).length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">
                No items in this category
              </p>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <ItemDetailDialog
        item={selectedItem}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
