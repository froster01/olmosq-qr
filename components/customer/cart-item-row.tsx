"use client";

import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import type { CartItem } from "@/lib/cart-types";
import { Coffee, Minus, Plus, Snowflake, Trash2 } from "lucide-react";

interface CartItemRowProps {
  item: CartItem;
  index: number;
}

export function CartItemRow({ item, index }: CartItemRowProps) {
  const { updateQuantity, removeItem } = useCart();
  const isCold = item.temperature === "cold";

  return (
    <div className="customer-cart-item-row">
      <div className="customer-cart-item-avatar" aria-hidden="true">
        {isCold ? (
          <Snowflake className="h-5 w-5" />
        ) : (
          <Coffee className="h-5 w-5" />
        )}
      </div>
      <div className="customer-cart-item-copy min-w-0 flex-1">
        <div className="customer-cart-item-heading">
          <p className="customer-cart-item-name font-heading text-base font-bold">
            {item.itemName}
          </p>
          <p className="customer-cart-item-price">
            RM {(item.unitPrice * item.quantity).toFixed(2)}
          </p>
        </div>
        <div className="customer-cart-item-meta">
          {item.temperature && (
            <span>{item.temperature === "hot" ? "Hot" : "Cold"}</span>
          )}
          {item.variantName && <span>{item.variantName}</span>}
          {item.modifierNames.length > 0 && (
            <span>+ {item.modifierNames.join(", ")}</span>
          )}
        </div>
        {item.notes && <p className="customer-cart-item-note">{item.notes}</p>}
        <div className="customer-cart-item-bottom">
          <div className="customer-cart-item-controls">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={`Decrease ${item.itemName} quantity`}
              className="touch-manipulation transition-transform active:scale-95"
              onClick={() => updateQuantity(index, item.quantity - 1)}
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <span>{item.quantity}</span>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={`Increase ${item.itemName} quantity`}
              className="touch-manipulation transition-transform active:scale-95"
              onClick={() => updateQuantity(index, item.quantity + 1)}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Remove ${item.itemName}`}
            className="customer-cart-remove touch-manipulation transition-transform active:scale-95"
            onClick={() => removeItem(index)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
