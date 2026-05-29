"use client";

import { FormEvent, useState, useTransition } from "react";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createCashMovementAction } from "@/app/actions/shifts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CashMovementType = "CASH_IN" | "CASH_OUT";

export function CashMovementForm({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [type, setType] = useState<CashMovementType>("CASH_IN");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const result = await createCashMovementAction({
        type,
        amount: Number(amount),
        note,
      });

      if (result.success) {
        toast.success(type === "CASH_IN" ? "Cash in recorded" : "Cash out recorded");
        setAmount("");
        setNote("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={type === "CASH_IN" ? "default" : "outline"}
          className={cn("h-11 justify-center", type !== "CASH_IN" && "bg-card")}
          disabled={disabled || pending}
          onClick={() => setType("CASH_IN")}
        >
          <ArrowDownToLine className="h-4 w-4" />
          Cash In
        </Button>
        <Button
          type="button"
          variant={type === "CASH_OUT" ? "default" : "outline"}
          className={cn("h-11 justify-center", type !== "CASH_OUT" && "bg-card")}
          disabled={disabled || pending}
          onClick={() => setType("CASH_OUT")}
        >
          <ArrowUpFromLine className="h-4 w-4" />
          Cash Out
        </Button>
      </div>
      <div className="grid gap-3">
        <div className="space-y-2">
          <label className="text-sm font-semibold" htmlFor="movement-amount">
            Amount
          </label>
          <Input
            id="movement-amount"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0.00"
            disabled={disabled || pending}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold" htmlFor="movement-note">
            Note
          </label>
          <Input
            id="movement-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Reason for cash movement"
            disabled={disabled || pending}
          />
        </div>
      </div>
      <Button
        type="submit"
        className="w-full sm:w-auto"
        disabled={disabled || pending}
      >
        Save Movement
      </Button>
    </form>
  );
}
