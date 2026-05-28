"use client";

import { Badge } from "@/components/ui/badge";

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Pending",
    className: "bg-accent/30 text-accent-foreground",
  },
  ACCEPTED: {
    label: "Accepted",
    className: "bg-secondary/12 text-secondary",
  },
  PREPARING: {
    label: "Preparing",
    className: "bg-primary/12 text-primary",
  },
  AWAITING_PAYMENT: {
    label: "Awaiting Payment",
    className: "bg-secondary/16 text-secondary",
  },
  PAID_SYNCING: {
    label: "Syncing...",
    className: "bg-primary/12 text-primary",
  },
  PAID_SYNCED_TO_LOYVERSE: {
    label: "Paid",
    className: "bg-primary/14 text-primary",
  },
  PAID_SYNC_FAILED: {
    label: "Sync Failed",
    className: "bg-destructive/10 text-destructive",
  },
  DONE: {
    label: "Done",
    className: "bg-accent/35 text-accent-foreground",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-muted text-muted-foreground",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || {
    label: status,
    className: "bg-muted text-muted-foreground",
  };

  return <Badge className={config.className}>{config.label}</Badge>;
}
