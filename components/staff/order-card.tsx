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

  async function handleStatusUpdate(newStatus: string) {
    const result = await updateOrderStatus(id, newStatus);
    if (result.success) {
      router.refresh();
    } else {
      toast.error("Failed to update status");
    }
  }

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <Link
              href={`/staff/orders/${id}`}
              className="font-semibold hover:underline"
            >
              #{orderNumber}
            </Link>
            <p className="text-sm text-muted-foreground">
              Table {tableCode} &middot; {customerName}
            </p>
            <p className="text-xs text-muted-foreground">
              {itemCount} item{itemCount !== 1 && "s"} &middot;{" "}
              {new Date(createdAt).toLocaleTimeString()}
            </p>
          </div>
          <div className="text-right space-y-1">
            <StatusBadge status={status} />
            <p className="font-semibold text-sm">
              RM {Number(total).toFixed(2)}
            </p>
          </div>
        </div>
        {actions.length > 0 && (
          <div className="flex gap-2">
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
