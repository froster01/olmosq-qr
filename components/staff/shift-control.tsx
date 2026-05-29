"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clock, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { closeShiftAction, openShiftAction } from "@/app/actions/shifts";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatReceiptMoney } from "@/lib/orders/receipt-summary";

type HeaderShift = {
  id: string;
  shiftNumber: number;
  openedAt: string;
  expectedCash: number;
} | null;

function formatOpenTime(openedAt: string): string {
  return new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(openedAt));
}

export function ShiftControl({
  shift,
  variant = "header",
}: {
  shift: HeaderShift;
  variant?: "header" | "page";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [openDialog, setOpenDialog] = useState(false);
  const [closeDialog, setCloseDialog] = useState(false);
  const [startingCash, setStartingCash] = useState("");
  const [actualCash, setActualCash] = useState("");
  const [closedNote, setClosedNote] = useState("");

  function handleOpen(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(startingCash);

    startTransition(async () => {
      const result = await openShiftAction(amount);
      if (result.success) {
        toast.success("Shift opened");
        setOpenDialog(false);
        setStartingCash("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleClose(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(actualCash);

    startTransition(async () => {
      const result = await closeShiftAction(amount, closedNote);
      if (result.success) {
        toast.success("Shift closed");
        setCloseDialog(false);
        setActualCash("");
        setClosedNote("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div
      className={cn(
        "staff-shift-control flex shrink-0 items-center gap-2 border bg-card shadow-sm",
        variant === "header"
          ? "ml-auto rounded-full px-2 py-1"
          : "w-full rounded-xl px-3 py-2 sm:w-auto",
        !shift && "border-destructive/25 bg-destructive/5"
      )}
    >
      {variant === "header" && (
        <div className="staff-shift-meta hidden items-center gap-2 pl-2 text-xs font-semibold text-muted-foreground sm:flex">
          {shift ? (
            <>
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>
                Shift {shift.shiftNumber} · {formatOpenTime(shift.openedAt)}
              </span>
            </>
          ) : (
            <>
              <Lock className="h-3.5 w-3.5 text-destructive" />
              <span>Shop Closed</span>
            </>
          )}
        </div>
      )}
      <Button
        size="sm"
        variant={shift ? "outline" : "default"}
        disabled={pending}
        onClick={() => (shift ? setCloseDialog(true) : setOpenDialog(true))}
        className={cn(
          "staff-shift-button h-9",
          variant === "header" ? "rounded-full" : "rounded-lg"
        )}
      >
        {shift ? (
          <Lock className="h-4 w-4" />
        ) : (
          <Unlock className="h-4 w-4" />
        )}
        {shift ? "Close Shift" : "Open Shift"}
      </Button>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <form onSubmit={handleOpen} className="contents">
            <DialogHeader>
              <DialogTitle>Open Shift</DialogTitle>
              <DialogDescription>
                Enter the cash already inside the drawer before taking orders.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <label className="text-sm font-semibold" htmlFor="starting-cash">
                Starting cash
              </label>
              <Input
                id="starting-cash"
                inputMode="decimal"
                min="0"
                step="0.01"
                type="number"
                value={startingCash}
                onChange={(event) => setStartingCash(event.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                <Unlock className="h-4 w-4" />
                Open Shift
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={closeDialog} onOpenChange={setCloseDialog}>
        <DialogContent>
          <form onSubmit={handleClose} className="contents">
            <DialogHeader>
              <DialogTitle>Close Shift</DialogTitle>
              <DialogDescription>
                Count the drawer cash and enter the actual amount before
                closing.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-2xl bg-muted/40 p-3 text-sm">
              <span className="text-muted-foreground">Expected cash</span>
              <p className="font-heading text-2xl font-bold text-primary">
                {formatReceiptMoney(shift?.expectedCash ?? 0)}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold" htmlFor="actual-cash">
                Actual counted cash
              </label>
              <Input
                id="actual-cash"
                inputMode="decimal"
                min="0"
                step="0.01"
                type="number"
                value={actualCash}
                onChange={(event) => setActualCash(event.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold" htmlFor="closed-note">
                Closing note
              </label>
              <textarea
                id="closed-note"
                className="min-h-20 w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/25"
                value={closedNote}
                onChange={(event) => setClosedNote(event.target.value)}
                placeholder="Optional note"
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                <Lock className="h-4 w-4" />
                Close Shift
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
