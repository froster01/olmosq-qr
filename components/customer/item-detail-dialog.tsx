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
import { Input } from "@/components/ui/input";
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
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null
  );
  const [selectedModifierIds, setSelectedModifierIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  if (!item) return null;

  const selectedVariant = item.variants.find(
    (v) => v.id === selectedVariantId
  );
  const selectedModifiers = item.modifiers.filter((m) =>
    selectedModifierIds.includes(m.id)
  );

  const unitPrice =
    Number(item.basePrice) +
    (selectedVariant ? Number(selectedVariant.priceAdjustment) : 0) +
    selectedModifiers.reduce((sum, m) => sum + Number(m.priceAdjustment), 0);

  const totalPrice = unitPrice * quantity;

  function handleAdd() {
    if (!item) return;
    addItem({
      itemId: item.id,
      itemName: item.name,
      variantId: selectedVariantId || undefined,
      variantName: selectedVariant?.name || undefined,
      quantity,
      modifierIds: selectedModifierIds,
      modifierNames: selectedModifiers.map((m) => m.name),
      notes: notes || undefined,
      unitPrice,
    });

    // Reset
    setSelectedVariantId(null);
    setSelectedModifierIds([]);
    setQuantity(1);
    setNotes("");
    onOpenChange(false);
  }

  function handleClose(open: boolean) {
    if (!open) {
      setSelectedVariantId(null);
      setSelectedModifierIds([]);
      setQuantity(1);
      setNotes("");
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item.name}</DialogTitle>
        </DialogHeader>

        {item.description && (
          <p className="text-sm text-muted-foreground">{item.description}</p>
        )}

        {/* Variants */}
        {item.variants.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Choose option</h4>
            <div className="space-y-1">
              {item.variants.map((variant) => (
                <label
                  key={variant.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedVariantId === variant.id
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted"
                  }`}
                >
                  <input
                    type="radio"
                    name="variant"
                    value={variant.id}
                    checked={selectedVariantId === variant.id}
                    onChange={() => setSelectedVariantId(variant.id)}
                    className="sr-only"
                  />
                  <span className="text-sm">{variant.name}</span>
                  {Number(variant.priceAdjustment) !== 0 && (
                    <span className="text-sm text-muted-foreground">
                      +RM {Number(variant.priceAdjustment).toFixed(2)}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Modifiers */}
        {item.modifiers.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Add-ons</h4>
            <div className="space-y-1">
              {item.modifiers.map((mod) => (
                <label
                  key={mod.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedModifierIds.includes(mod.id)
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedModifierIds.includes(mod.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedModifierIds((prev) => [...prev, mod.id]);
                      } else {
                        setSelectedModifierIds((prev) =>
                          prev.filter((id) => id !== mod.id)
                        );
                      }
                    }}
                    className="sr-only"
                  />
                  <span className="text-sm">{mod.name}</span>
                  {Number(mod.priceAdjustment) !== 0 && (
                    <span className="text-sm text-muted-foreground">
                      +RM {Number(mod.priceAdjustment).toFixed(2)}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Notes */}
        <div>
          <label className="text-sm font-medium">Special instructions</label>
          <Input
            placeholder="Any special requests..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1"
          />
        </div>

        {/* Quantity */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
          >
            -
          </Button>
          <span className="font-medium w-8 text-center">{quantity}</span>
          <Button
            variant="outline"
            size="sm"
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
