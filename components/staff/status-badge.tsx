"use client";

import { Badge } from "@/components/ui/badge";

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  PENDING: { label: "Pending", variant: "outline" },
  ACCEPTED: { label: "Accepted", variant: "secondary" },
  PREPARING: { label: "Preparing", variant: "default" },
  AWAITING_PAYMENT: { label: "Awaiting Payment", variant: "outline" },
  PAID_SYNCING: { label: "Syncing...", variant: "secondary" },
  PAID_SYNCED_TO_LOYVERSE: { label: "Paid", variant: "default" },
  PAID_SYNC_FAILED: { label: "Sync Failed", variant: "destructive" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || {
    label: status,
    variant: "outline" as const,
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
