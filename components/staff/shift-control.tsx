"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clock, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { closeShiftAction, openShiftAction } from "@/app/actions/shifts";
import { cn } from "@/lib/utils";

type HeaderShift = {
  id: string;
  shiftNumber: number;
  openedAt: string;
} | null;

function formatOpenTime(openedAt: string): string {
  return new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(openedAt));
}

export function ShiftControl({ shift }: { shift: HeaderShift }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleOpen() {
    startTransition(async () => {
      const result = await openShiftAction();
      if (result.success) {
        toast.success("Shift opened");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleClose() {
    startTransition(async () => {
      const result = await closeShiftAction();
      if (result.success) {
        toast.success("Shift closed");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div
      className={cn(
        "ml-auto flex shrink-0 items-center gap-2 rounded-full border bg-card px-2 py-1 shadow-sm",
        !shift && "border-destructive/25 bg-destructive/5"
      )}
    >
      <div className="hidden items-center gap-2 pl-2 text-xs font-semibold text-muted-foreground sm:flex">
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
      <Button
        size="sm"
        variant={shift ? "outline" : "default"}
        disabled={pending}
        onClick={shift ? handleClose : handleOpen}
        className="h-9 rounded-full"
      >
        {shift ? (
          <Lock className="h-4 w-4" />
        ) : (
          <Unlock className="h-4 w-4" />
        )}
        {shift ? "Close Shift" : "Open Shift"}
      </Button>
    </div>
  );
}
