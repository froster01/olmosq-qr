import { Banknote, Clock, ReceiptText } from "lucide-react";
import Link from "next/link";

import { prisma } from "@/lib/db";
import { getCurrentShift } from "@/lib/shifts/current-shift";
import { formatOrderDisplayNumber } from "@/lib/shifts/shift-rules";
import { formatReceiptMoney } from "@/lib/orders/receipt-summary";
import { summarizeCashDrawer } from "@/lib/payments/cash-drawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/staff/status-badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

function formatDateTime(date: Date | string | null): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function formatTime(date: Date | string | null): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

export default async function CashDrawerPage() {
  const currentShift = await getCurrentShift();
  const cashOrders = currentShift
    ? await prisma.order.findMany({
        where: {
          shiftId: currentShift.id,
          paymentType: { type: "CASH" },
        },
        include: {
          paymentType: true,
        },
        orderBy: { paidAt: "desc" },
      })
    : [];

  const localCashOrders = cashOrders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    shiftOrderNumber: order.shiftOrderNumber,
    tableCode: order.tableCode,
    customerName: order.customerName,
    status: order.status,
    paidAt: order.paidAt,
    total: Number(order.total),
    cashReceived:
      order.cashReceived === null ? null : Number(order.cashReceived),
    cashChange: order.cashChange === null ? null : Number(order.cashChange),
    paymentType: order.paymentType,
  }));

  const cashSummary = summarizeCashDrawer(localCashOrders);
  const closedShifts = await prisma.shift.findMany({
    where: { status: "CLOSED" },
    include: {
      orders: {
        include: { paymentType: true },
      },
    },
    orderBy: { closedAt: "desc" },
    take: 8,
  });

  return (
    <div className="staff-page space-y-6">
      <div className="staff-page-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="staff-page-title font-heading text-4xl font-bold">
            Cash Drawer
          </h1>
          <p className="staff-page-subtitle text-muted-foreground">
            Physical cash payments and closed shift reports from this app.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground">
          <Clock className="h-4 w-4 text-primary" />
          {currentShift
            ? `Shift ${currentShift.shiftNumber} opened ${formatTime(
                currentShift.openedAt
              )}`
            : "No open shift"}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <CashMetricCard
          label="Cash sales"
          value={formatReceiptMoney(cashSummary.salesTotal)}
        />
        <CashMetricCard
          label="Cash received"
          value={formatReceiptMoney(cashSummary.cashReceivedTotal)}
        />
        <CashMetricCard
          label="Change given"
          value={formatReceiptMoney(cashSummary.changeGivenTotal)}
        />
        <CashMetricCard
          label="Expected physical cash"
          value={formatReceiptMoney(cashSummary.expectedCashImpact)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-primary" />
              Current Shift Cash Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {localCashOrders.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-muted/25 p-6 text-sm text-muted-foreground">
                {currentShift
                  ? "No physical cash payments recorded for this open shift."
                  : "Open a shift from the staff header to start tracking cash."}
              </div>
            ) : (
              <div className="space-y-2">
                {localCashOrders.map((order) => (
                  <Link
                    key={order.id}
                    className="grid gap-3 rounded-2xl border bg-card p-3 transition-colors hover:border-primary/50 hover:bg-accent/15 md:grid-cols-[1fr_auto_auto]"
                    href={`/staff/orders/${order.id}`}
                  >
                    <div>
                      <p className="text-xs font-bold uppercase text-muted-foreground">
                        Table {order.tableCode}
                      </p>
                      <p className="font-heading text-xl font-bold">
                        Order{" "}
                        {formatOrderDisplayNumber({
                          shiftOrderNumber: order.shiftOrderNumber,
                          orderNumber: order.orderNumber,
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.customerName} &middot; {formatTime(order.paidAt)}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 rounded-2xl bg-muted/35 p-2 text-sm md:min-w-72">
                      <CashLine
                        label="Total"
                        value={formatReceiptMoney(order.total)}
                      />
                      <CashLine
                        label="Cash"
                        value={formatReceiptMoney(
                          order.cashReceived ?? order.total
                        )}
                      />
                      <CashLine
                        label="Change"
                        value={formatReceiptMoney(order.cashChange ?? 0)}
                      />
                    </div>
                    <div className="flex items-center md:justify-end">
                      <StatusBadge status={order.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-primary" />
              Closed Shift Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {closedShifts.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-muted/25 p-4 text-sm text-muted-foreground">
                Closed shift reports will appear here after the first shift is
                closed.
              </div>
            ) : (
              closedShifts.map((shift) => {
                const salesTotal = shift.orders
                  .filter((order) => order.status !== "CANCELLED")
                  .reduce((sum, order) => sum + Number(order.total), 0);

                return (
                  <div
                    key={shift.id}
                    className="rounded-2xl border bg-card p-3 text-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-heading text-lg font-bold">
                          Shift {shift.shiftNumber}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(shift.openedAt)} -{" "}
                          {formatDateTime(shift.closedAt)}
                        </p>
                      </div>
                      <p className="font-heading font-bold text-primary">
                        {formatReceiptMoney(salesTotal)}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">
                        {shift.orders.length} orders
                      </span>
                      <Link href={`/staff/shift-reports/${shift.id}`}>
                        <Button size="sm" variant="outline">
                          View Report
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CashMetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-bold uppercase text-muted-foreground">
          {label}
        </p>
        <p className="mt-2 font-heading text-2xl font-bold text-primary">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function CashLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
