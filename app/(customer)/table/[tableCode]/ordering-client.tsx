"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartProvider, useCart } from "@/lib/cart-context";
import { MenuBrowser } from "@/components/customer/menu-browser";
import { CartSheet } from "@/components/customer/cart-sheet";
import { CheckoutForm } from "@/components/customer/checkout-form";
import type { Category, Item, Variant, ItemModifier } from "@prisma/client";
import { toast } from "sonner";
import { submitOrder } from "@/app/actions/orders";

type ItemWithRelations = Item & {
  variants: Variant[];
  modifiers: ItemModifier[];
};

type CategoryWithItems = Category & {
  items: ItemWithRelations[];
};

function OrderingContent({
  tableCode,
  tableNumber,
  categories,
}: {
  tableCode: string;
  tableNumber: number;
  categories: CategoryWithItems[];
}) {
  const { items, subtotal } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmitOrder(customerName: string) {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setSubmitting(true);
    setCartOpen(false);

    try {
      const formData = new FormData();
      formData.set("tableCode", tableCode);
      formData.set("customerName", customerName);
      formData.set("items", JSON.stringify(items));

      const result = await submitOrder(formData);
      if (result.success && result.data) {
        router.push(`/order/${result.data.orderId}/confirmation`);
      } else {
        toast.error("Failed to place order. Please try again.");
        console.error(result);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleCartSubmit() {
    setCartOpen(false);
    setCheckoutOpen(true);
  }

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background border-b">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <Coffee className="h-5 w-5" />
            <div>
              <p className="font-semibold text-sm leading-tight">
                Olmosq Coffee
              </p>
              <p className="text-xs text-muted-foreground">
                Table {tableNumber}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="relative"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="h-4 w-4" />
            {items.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {items.length}
              </span>
            )}
          </Button>
        </div>
      </header>

      {/* Menu */}
      <div className="flex-1 px-4 py-4">
        <MenuBrowser categories={categories} />
      </div>

      {/* Floating cart button when items in cart */}
      {items.length > 0 && (
        <div className="sticky bottom-0 p-4 bg-background border-t">
          <Button
            className="w-full"
            size="lg"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            View Cart ({items.length}) - RM {subtotal.toFixed(2)}
          </Button>
        </div>
      )}

      {/* Cart Sheet */}
      <CartSheet
        open={cartOpen}
        onOpenChange={setCartOpen}
        onSubmit={handleCartSubmit}
      />

      {/* Checkout Form */}
      <CheckoutForm
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        onSubmit={handleSubmitOrder}
      />

      {submitting && (
        <div className="fixed inset-0 bg-background/80 z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
            <p className="text-sm">Placing your order...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function OrderingPageClient({
  tableCode,
  tableNumber,
  categories,
}: {
  tableCode: string;
  tableNumber: number;
  categories: CategoryWithItems[];
}) {
  return (
    <CartProvider>
      <OrderingContent
        tableCode={tableCode}
        tableNumber={tableNumber}
        categories={categories}
      />
    </CartProvider>
  );
}
