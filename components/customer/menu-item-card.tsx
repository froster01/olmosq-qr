"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coffee } from "lucide-react";
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
  const hasImage = Boolean(item.imageUrl);

  return (
    <Card
      className="cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(51,51,51,0.08)]"
      onClick={() => onSelect(item)}
    >
      <CardContent className="flex gap-4 p-4">
        <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-accent/35 text-primary">
          {hasImage ? (
            <div
              className="size-full bg-cover bg-center"
              style={{ backgroundImage: `url(${item.imageUrl ?? ""})` }}
              aria-label={item.name}
            />
          ) : (
            <div className="flex flex-col items-center gap-1">
              <Coffee className="h-6 w-6" />
              <span className="font-heading text-lg font-bold">
                {item.name.slice(0, 1)}
              </span>
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
          <div>
            <h3 className="truncate font-heading text-lg font-bold leading-tight">
              {item.name}
            </h3>
            {item.description && (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {item.description}
              </p>
            )}
          </div>
          <div className="flex items-end justify-between gap-2">
            <p className="font-bold text-primary">
              RM {Number(item.basePrice).toFixed(2)}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={(event) => {
                event.stopPropagation();
                onSelect(item);
              }}
            >
              Add
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
