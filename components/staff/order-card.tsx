"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import Link from "next/link";
import { updateOrderStatus } from "@/app/actions/orders";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { OrderStatus } from "@prisma/client";

interface OrderCardProps {
  id: string;
  orderNumber: number;
  tableCode: string;
  customerName: string;
  status: OrderStatus;
  total: number;
  itemCount: number;
  createdAt: string;
}

const statusActions: Record<string, { label: string; nextStatus: string }[]> = {
  PENDING: [
    { label: "Accept", nextStatus: "ACCEPTED" },
    { label: "Cancel", nextStatus: "CANCELLED" },
  ],
  ACCEPTED: [
    { label: "Start Preparing", nextStatus: "PREPARING" },
    { label: "Cancel", nextStatus: "CANCELLED" },
  ],
  PREPARING: [{ label: "Ready for Payment", nextStatus: "AWAITING_PAYMENT" }],
  PAID_SYNC_FAILED: [{ label: "Retry Sync", nextStatus: "PAID_SYNCING" }],
};

export function OrderCard({
  id,
  orderNumber,
  tableCode,
  customerName,
  status,
  total,
  itemCount,
  createdAt,
}: OrderCardProps) {
  const actions = statusActions[status] || [];
  const router = useRouter();
  const createdTime = new Date(createdAt).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  async function handleStatusUpdate(newStatus: string) {
    const result = await updateOrderStatus(id, newStatus);
    if (result.success) {
      router.refresh();
    } else {
      toast.error("Failed to update status");
    }
  }

  return (
    <Card className="relative transition-all hover:-translate-y-0.5 hover:bg-card hover:shadow-[0_8px_24px_rgba(51,51,51,0.08)]">
      <Link
        href={`/staff/orders/${id}`}
        aria-label={`Open order #${orderNumber} details`}
        className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />
      <CardContent className="space-y-4 pt-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Table {tableCode}
            </p>
            <span className="font-heading text-xl font-bold">
              Order #{orderNumber}
            </span>
            <p className="truncate text-sm font-medium text-muted-foreground">
              {customerName}
            </p>
          </div>
          <div className="space-y-2 text-right">
            <StatusBadge status={status} />
            <p className="font-heading text-lg font-bold text-primary">
              RM {Number(total).toFixed(2)}
            </p>
          </div>
        </div>
        <div className="rounded-xl bg-muted/55 p-3 text-sm">
          <div className="flex justify-between">
            <span className="font-semibold">
              {itemCount} item{itemCount !== 1 && "s"}
            </span>
            <span className="text-muted-foreground">{createdTime}</span>
          </div>
        </div>
        {(actions.length > 0 || status === "AWAITING_PAYMENT") && (
          <div className="relative z-20 flex gap-2">
            {actions.map((action) => (
              <Button
                key={action.nextStatus}
                size="sm"
                variant={
                  action.nextStatus === "CANCELLED" ? "destructive" : "default"
                }
                onClick={() => handleStatusUpdate(action.nextStatus)}
              >
                {action.label}
              </Button>
            ))}
            {status === "AWAITING_PAYMENT" && (
              <Link href={`/staff/orders/${id}`}>
                <Button size="sm">Collect Payment</Button>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
