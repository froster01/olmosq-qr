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
import { useCart } from "@/lib/cart-context";
import { ReceiptText, UserRound, Wallet } from "lucide-react";

interface CheckoutFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (customerName: string) => void;
}

export function CheckoutForm({
  open,
  onOpenChange,
  onSubmit,
}: CheckoutFormProps) {
  const { customerName, setCustomerName, items, subtotal } = useCart();
  const [name, setName] = useState(customerName);
  const [error, setError] = useState("");

  function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your name");
      return;
    }
    setCustomerName(trimmed);
    onSubmit(trimmed);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="customer-checkout-dialog max-w-sm overflow-hidden p-0">
        <div className="customer-checkout-body">
          <DialogHeader className="customer-checkout-header">
            <div className="customer-checkout-icon" aria-hidden="true">
              <UserRound className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="customer-checkout-kicker">Final step</p>
              <DialogTitle className="customer-checkout-title">
                What should we call you?
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="customer-checkout-summary">
            <div>
              <span>
                <ReceiptText className="h-3.5 w-3.5" />
                {items.length} {items.length === 1 ? "item" : "items"}
              </span>
              <strong>RM {subtotal.toFixed(2)}</strong>
            </div>
            <p>
              Pay at the counter. Staff will confirm before preparation starts.
            </p>
          </div>

          <label className="customer-checkout-field" htmlFor="customer-name">
            <span>Name for pickup</span>
            <Input
              id="customer-name"
              className="customer-checkout-input"
              placeholder="e.g. Syafiq"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
              autoFocus
            />
          </label>
          {error && <p className="customer-checkout-error">{error}</p>}
        </div>

        <DialogFooter className="customer-checkout-footer">
          <Button
            onClick={handleSubmit}
            className="customer-checkout-submit w-full touch-manipulation transition-transform active:scale-[0.98]"
            size="lg"
          >
            <Wallet className="h-4 w-4" />
            Send to Counter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
