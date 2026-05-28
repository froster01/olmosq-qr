"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { CartItemRow } from "./cart-item-row";
import { ShoppingBag } from "lucide-react";

interface CartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}

export function CartSheet({ open, onOpenChange, onSubmit }: CartSheetProps) {
  const { items, subtotal, clearCart } = useCart();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="customer-cart-sheet flex w-full flex-col overflow-hidden sm:mx-auto sm:max-w-md"
      >
        <SheetHeader className="customer-cart-header">
          <SheetTitle className="customer-cart-title flex items-center gap-3">
            <span className="customer-cart-title-icon">
              <ShoppingBag className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span>Your cart</span>
              <span className="customer-cart-title-count">
                {items.length} {items.length === 1 ? "item" : "items"}
              </span>
            </span>
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="customer-cart-empty">
            <ShoppingBag className="h-6 w-6" />
            <p>Your cart is empty</p>
            <span>Add something you like from the menu.</span>
          </div>
        ) : (
          <div className="customer-cart-list flex-1 overflow-y-auto">
            {items.map((item, index) => (
              <div
                className="customer-cart-item-card"
                key={`${item.itemId}-${item.variantId}-${index}`}
              >
                <CartItemRow item={item} index={index} />
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <div className="customer-cart-footer">
            <div className="customer-cart-total">
              <span>Total</span>
              <strong>RM {subtotal.toFixed(2)}</strong>
            </div>
            <p className="customer-cart-counter-note">
              Pay this amount at the cashier to start preparation.
            </p>
            <div className="customer-cart-actions">
              <Button
                className="customer-cart-submit touch-manipulation transition-transform active:scale-[0.98]"
                size="lg"
                onClick={onSubmit}
              >
                Pay at Counter
              </Button>
              <Button
                variant="outline"
                className="customer-cart-clear touch-manipulation transition-transform active:scale-[0.98]"
                onClick={clearCart}
              >
                Clear Cart
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
