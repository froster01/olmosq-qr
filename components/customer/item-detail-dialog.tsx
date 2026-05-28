"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/lib/cart-context";
import type { Item, Variant, ItemModifier } from "@prisma/client";

type ItemWithRelations = Item & {
  variants: Variant[];
  modifiers: ItemModifier[];
};

interface ItemDetailDialogProps {
  item: ItemWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ItemDetailDialog({
  item,
  open,
  onOpenChange,
}: ItemDetailDialogProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  if (!item) return null;

  const defaultVariant = item.variants[0] ?? null;

  const unitPrice =
    Number(item.basePrice) +
    (defaultVariant ? Number(defaultVariant.priceAdjustment) : 0);

  const totalPrice = unitPrice * quantity;

  function handleAdd() {
    if (!item) return;
    addItem({
      itemId: item.id,
      itemName: item.name,
      variantId: defaultVariant?.id,
      quantity,
      modifierIds: [],
      modifierNames: [],
      notes: notes || undefined,
      unitPrice,
    });

    // Reset
    setQuantity(1);
    setNotes("");
    onOpenChange(false);
  }

  function handleClose(open: boolean) {
    if (!open) {
      setQuantity(1);
      setNotes("");
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item.name}</DialogTitle>
        </DialogHeader>

        {item.description && (
          <p className="text-sm text-muted-foreground">{item.description}</p>
        )}

        {/* Notes */}
        <div className="rounded-2xl border bg-accent/20 p-4">
          <label
            htmlFor="special-request"
            className="font-heading text-lg font-bold"
          >
            Special request
          </label>
          <p className="mt-1 text-xs text-muted-foreground">
            Less ice, no sugar, extra hot, or anything we should know.
          </p>
          <textarea
            id="special-request"
            placeholder="Type your request here..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="mt-3 min-h-28 w-full resize-none rounded-2xl border border-input bg-card px-4 py-3 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-ring/20"
          />
        </div>

        <Separator />

        {/* Quantity */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
          >
            -
          </Button>
          <span className="w-10 text-center font-heading text-xl font-bold">
            {quantity}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setQuantity(quantity + 1)}
          >
            +
          </Button>
        </div>

        <DialogFooter>
          <Button onClick={handleAdd} className="w-full">
            Add to Cart - RM {totalPrice.toFixed(2)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
