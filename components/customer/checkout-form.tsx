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
  const { customerName, setCustomerName } = useCart();
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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>What should we call you?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          We will use this name when your table order is ready.
        </p>
        <Input
          placeholder="Enter your name"
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
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button onClick={handleSubmit} className="w-full" size="lg">
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
