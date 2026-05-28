"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import Link from "next/link";
import { updateOrderStatus } from "@/app/actions/orders";
import { getStaffStatusActions } from "@/lib/orders/status-flow";
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
  const actions = getStaffStatusActions(status);
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
    <Card className="staff-order-card relative py-0 transition-all hover:-translate-y-0.5 hover:bg-card hover:shadow-[0_8px_24px_rgba(51,51,51,0.08)]">
      <Link
        href={`/staff/orders/${id}`}
        aria-label={`Open order #${orderNumber} details`}
        className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />
      <CardContent className="staff-order-card-content grid gap-3 py-3 sm:grid-cols-[minmax(12rem,1.3fr)_minmax(10rem,0.8fr)_auto] sm:items-center lg:grid-cols-[minmax(14rem,1.4fr)_minmax(12rem,0.9fr)_auto_auto]">
        <div className="staff-order-identity min-w-0">
          <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
            Table {tableCode}
          </p>
          <span className="staff-order-number block truncate font-heading text-lg font-bold leading-tight">
            Order #{orderNumber}
          </span>
          <p className="truncate text-sm font-medium text-muted-foreground">
            {customerName}
          </p>
        </div>

        <div className="staff-order-meta flex items-center justify-between gap-3 rounded-xl bg-muted/55 px-3 py-2 text-sm sm:justify-start">
          <span className="font-semibold">
            {itemCount} item{itemCount !== 1 && "s"}
          </span>
          <span className="text-muted-foreground">{createdTime}</span>
        </div>

        <div className="staff-order-total flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center sm:text-right">
          <StatusBadge status={status} />
          <p className="font-heading text-base font-bold text-primary">
            RM {Number(total).toFixed(2)}
          </p>
        </div>

        {actions.length > 0 && (
          <div className="staff-order-actions relative z-20 flex flex-wrap gap-2 lg:justify-end">
            {actions.map((action) => (
              action.nextStatus === "AWAITING_PAYMENT" ? (
                <Link key={action.nextStatus} href={`/staff/orders/${id}`}>
                  <Button size="sm">{action.label}</Button>
                </Link>
              ) : (
                <Button
                  key={action.nextStatus}
                  size="sm"
                  variant={action.variant || "default"}
                  onClick={() => handleStatusUpdate(action.nextStatus)}
                >
                  {action.label}
                </Button>
              )
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
