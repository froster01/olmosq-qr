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
import { useCart } from "@/lib/cart-context";
import { cn } from "@/lib/utils";
import type { Item, Variant, ItemModifier } from "@prisma/client";
import type { Temperature } from "@/lib/cart-types";
import { Coffee, Minus, Plus, Snowflake } from "lucide-react";

type ItemWithRelations = Item & {
  variants: Variant[];
  modifiers: ItemModifier[];
  asksTemperature: boolean;
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
  const [temperature, setTemperature] = useState<Temperature>("cold");

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
      temperature: item.asksTemperature ? temperature : undefined,
    });

    // Reset
    setQuantity(1);
    setNotes("");
    setTemperature("cold");
    onOpenChange(false);
  }

  function handleClose(open: boolean) {
    if (!open) {
      setQuantity(1);
      setNotes("");
      setTemperature("cold");
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="customer-item-dialog max-h-[calc(100dvh-1rem)] max-w-md overflow-hidden p-0">
        <div className="customer-item-dialog-body space-y-4 overflow-y-auto p-5 pb-4">
          <DialogHeader className="customer-item-dialog-header gap-2">
            <div className="flex items-start justify-between gap-3 pr-8">
              <div className="min-w-0 space-y-1">
                <p className="customer-item-dialog-kicker">Customize</p>
                <DialogTitle className="customer-item-dialog-title">
                  {item.name}
                </DialogTitle>
              </div>
              <div className="customer-unit-price">
                RM {unitPrice.toFixed(2)}
              </div>
            </div>

            {item.description && (
              <p className="customer-item-dialog-description text-sm text-muted-foreground">
                {item.description}
              </p>
            )}
          </DialogHeader>

          {item.asksTemperature && (
            <section className="customer-temperature-card space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label className="customer-temperature-label font-heading text-sm font-semibold text-foreground">
                  Temperature
                </label>
                <span className="customer-temperature-hint">Choose one</span>
              </div>
              <div
                aria-label="Temperature"
                role="radiogroup"
                className="customer-temperature-selector grid grid-cols-2 gap-1 rounded-full p-1"
              >
                <label className="relative cursor-pointer touch-manipulation">
                  <input
                    type="radio"
                    name="temperature"
                    value="hot"
                    checked={temperature === "hot"}
                    onChange={(e) =>
                      setTemperature(e.target.value as Temperature)
                    }
                    className="sr-only"
                  />
                  <div
                    className={cn(
                      "customer-temperature-button flex items-center justify-center gap-2 rounded-full border px-3 font-semibold transition-all duration-200",
                      temperature === "hot"
                        ? "border-primary bg-primary text-primary-foreground shadow-[0_8px_18px_rgba(80,101,47,0.18)]"
                        : "border-transparent bg-transparent text-foreground/75 hover:bg-card"
                    )}
                  >
                    <Coffee className="size-4" aria-hidden="true" />
                    <span>Hot</span>
                  </div>
                </label>
                <label className="relative cursor-pointer touch-manipulation">
                  <input
                    type="radio"
                    name="temperature"
                    value="cold"
                    checked={temperature === "cold"}
                    onChange={(e) =>
                      setTemperature(e.target.value as Temperature)
                    }
                    className="sr-only"
                  />
                  <div
                    className={cn(
                      "customer-temperature-button flex items-center justify-center gap-2 rounded-full border px-3 font-semibold transition-all duration-200",
                      temperature === "cold"
                        ? "border-primary bg-primary text-primary-foreground shadow-[0_8px_18px_rgba(80,101,47,0.18)]"
                        : "border-transparent bg-transparent text-foreground/75 hover:bg-card"
                    )}
                  >
                    <Snowflake className="size-4" aria-hidden="true" />
                    <span>Cold</span>
                  </div>
                </label>
              </div>
            </section>
          )}

          <section className="customer-request-card">
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="special-request"
                className="customer-request-label font-heading font-bold"
              >
                Special request
              </label>
              <span className="customer-request-optional">Optional</span>
            </div>
            <textarea
              id="special-request"
              placeholder="Less ice, no sugar, extra hot..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="customer-request-input mt-3 w-full resize-none rounded-2xl border border-input bg-card px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-ring/20"
            />
          </section>
        </div>

        <DialogFooter className="customer-item-dialog-footer">
          <div className="customer-item-dialog-footer-row">
            <div className="customer-quantity-control">
              <Button
                variant="outline"
                size="icon"
                aria-label="Decrease quantity"
                className="touch-manipulation transition-transform active:scale-95"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="size-4" />
              </Button>
              <span>{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                aria-label="Increase quantity"
                className="touch-manipulation transition-transform active:scale-95"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="size-4" />
              </Button>
            </div>
            <Button
              onClick={handleAdd}
              className="customer-add-to-cart-button min-w-0 flex-1 touch-manipulation transition-transform active:scale-95"
            >
              Add - RM {totalPrice.toFixed(2)}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
