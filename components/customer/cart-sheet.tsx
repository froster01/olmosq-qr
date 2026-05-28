"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Your Cart ({items.length})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Your cart is empty</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4">
            {items.map((item, index) => (
              <div key={`${item.itemId}-${item.variantId}-${index}`}>
                <CartItemRow item={item} index={index} />
                {index < items.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3 p-4 pt-3">
              <div className="flex justify-between font-heading text-xl font-bold">
                <span>Total</span>
                <span className="text-primary">RM {subtotal.toFixed(2)}</span>
              </div>
              <SheetFooter className="flex flex-col gap-2 sm:flex-col">
                <Button className="w-full" size="lg" onClick={onSubmit}>
                  Pay at Counter
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={clearCart}
                >
                  Clear Cart
                </Button>
              </SheetFooter>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
