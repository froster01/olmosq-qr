"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import Link from "next/link";
import { updateOrderStatus } from "@/app/actions/orders";
import { getStaffStatusActions } from "@/lib/orders/status-flow";
import { formatOrderDisplayNumber } from "@/lib/shifts/shift-rules";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface OrderCardProps {
  id: string;
  orderNumber: number;
  shiftOrderNumber: number | null;
  tableCode: string;
  customerName: string;
  status: string;
  total: number;
  itemCount: number;
  createdAt: string;
}

export function OrderCard({
  id,
  orderNumber,
  shiftOrderNumber,
  tableCode,
  customerName,
  status,
  total,
  itemCount,
  createdAt,
}: OrderCardProps) {
  const actions = getStaffStatusActions(status);
  const router = useRouter();
  const createdTime = formatStaffTime(createdAt);
  const displayNumber = formatOrderDisplayNumber({
    shiftOrderNumber,
    orderNumber,
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
        aria-label={`Open order ${displayNumber} details`}
        className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />
      <CardContent className="staff-order-card-content grid gap-3 py-3 md:grid-cols-[minmax(11rem,1fr)_auto_auto] md:items-center">
        <div className="staff-order-identity min-w-0">
          <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
            Table {tableCode}
          </p>
          <span className="staff-order-number block truncate font-heading text-lg font-bold leading-tight">
            Order {displayNumber}
          </span>
          <p className="truncate text-sm font-medium text-muted-foreground">
            {customerName}
          </p>
        </div>

        <div className="staff-order-summary flex min-w-0 flex-wrap items-center gap-2 md:justify-end">
          <div className="staff-order-meta flex min-w-0 items-center gap-2 text-sm">
            <span className="staff-order-meta-badge font-semibold">
              {itemCount} item{itemCount !== 1 && "s"}
            </span>
            <span className="staff-order-meta-badge text-muted-foreground">
              {createdTime}
            </span>
          </div>

          <div className="staff-order-total flex items-center gap-2 text-right">
            <StatusBadge status={status} />
            <p className="font-heading text-base font-bold text-primary">
              RM {Number(total).toFixed(2)}
            </p>
          </div>
        </div>

        {actions.length > 0 && (
          <div className="staff-order-actions relative z-20 flex flex-wrap justify-end gap-2 md:justify-end">
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

function formatStaffTime(value: string) {
  return new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
