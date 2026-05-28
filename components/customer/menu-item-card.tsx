"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Item, Variant, ItemModifier } from "@prisma/client";

type ItemWithRelations = Item & {
  variants: Variant[];
  modifiers: ItemModifier[];
};

interface MenuItemCardProps {
  item: ItemWithRelations;
  onSelect: (item: ItemWithRelations) => void;
}

export function MenuItemCard({ item, onSelect }: MenuItemCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onSelect(item)}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm leading-tight truncate">
              {item.name}
            </h3>
            {item.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {item.description}
              </p>
            )}
            {item.variants.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {item.variants.length} option{item.variants.length !== 1 && "s"}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="font-semibold text-sm">
              RM {Number(item.basePrice).toFixed(2)}
            </p>
          </div>
        </div>
        <Button size="sm" className="w-full mt-3" variant="outline">
          {item.variants.length > 0 || item.modifiers.length > 0
            ? "Customize & Add"
            : "Add to Cart"}
        </Button>
      </CardContent>
    </Card>
  );
}
