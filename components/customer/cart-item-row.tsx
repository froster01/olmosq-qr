"use client";

import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import type { CartItem } from "@/lib/cart-types";

interface CartItemRowProps {
  item: CartItem;
  index: number;
}

export function CartItemRow({ item, index }: CartItemRowProps) {
  const { updateQuantity, removeItem } = useCart();

  return (
    <div className="flex items-start gap-3 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{item.itemName}</p>
        {item.variantName && (
          <p className="text-xs text-muted-foreground">{item.variantName}</p>
        )}
        {item.modifierNames.length > 0 && (
          <p className="text-xs text-muted-foreground">
            + {item.modifierNames.join(", ")}
          </p>
        )}
        {item.notes && (
          <p className="text-xs text-muted-foreground italic">{item.notes}</p>
        )}
        <p className="text-sm font-medium mt-1">
          RM {(item.unitPrice * item.quantity).toFixed(2)}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => updateQuantity(index, item.quantity - 1)}
        >
          -
        </Button>
        <span className="w-6 text-center text-sm">{item.quantity}</span>
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => updateQuantity(index, item.quantity + 1)}
        >
          +
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-destructive"
          onClick={() => removeItem(index)}
        >
          Remove
        </Button>
      </div>
    </div>
  );
}
