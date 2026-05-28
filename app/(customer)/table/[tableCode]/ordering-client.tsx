"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand-mark";
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
      if ("data" in result && result.data) {
        router.push(`/order/${result.data.orderId}/confirmation`);
      } else {
        const error = "error" in result ? result.error : null;
        const shiftError =
          error && typeof error === "object" && "shift" in error
            ? error.shift?.[0]
            : null;
        toast.error(shiftError ?? "Failed to place order. Please try again.");
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
    <div className="min-h-dvh flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/95 shadow-sm backdrop-blur">
        <div className="flex h-16 items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <BrandMark />
            <div>
              <p className="font-heading text-base font-bold leading-tight text-primary">
                Olmosq Coffee
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                Table {tableNumber}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="relative"
            onClick={() => setCartOpen(true)}
            aria-label="Open cart"
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
      <div className="flex-1 space-y-5 px-5 py-5">
        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-[0_4px_16px_rgba(51,51,51,0.05)]">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-accent/50 text-primary">
              <Coffee className="h-5 w-5" />
            </div>
            <div>
              <p className="font-heading text-xl font-bold leading-tight">
                Fresh from the bar
              </p>
              <p className="text-sm text-muted-foreground">
                Choose your favourites, then pay at the counter to start prep.
              </p>
            </div>
          </div>
        </section>
        <MenuBrowser categories={categories} />
      </div>

      {/* Floating cart button when items in cart */}
      {items.length > 0 && (
        <div className="sticky bottom-0 z-20 border-t bg-background/95 p-4 backdrop-blur">
          <Button
            className="w-full"
            size="lg"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Pay at Counter ({items.length}) - RM {subtotal.toFixed(2)}
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
            <p className="text-sm">Sending to counter...</p>
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
