import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Banknote,
  Clock,
  ReceiptText,
} from "lucide-react";
import Link from "next/link";

import { prisma } from "@/lib/db";
import { getCurrentShift } from "@/lib/shifts/current-shift";
import { formatOrderDisplayNumber } from "@/lib/shifts/shift-rules";
import { formatReceiptMoney } from "@/lib/orders/receipt-summary";
import { calculateCashDrawerTotals } from "@/lib/payments/cash-drawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/staff/status-badge";
import { Button } from "@/components/ui/button";
import { CashMovementForm } from "@/components/staff/cash-movement-form";

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

  const cashMovements = currentShift
    ? await prisma.cashMovement.findMany({
        where: { shiftId: currentShift.id },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const allShiftOrders = currentShift
    ? await prisma.order.findMany({
        where: {
          shiftId: currentShift.id,
        },
        include: {
          paymentType: true,
        },
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

  const localCashMovements = cashMovements.map((movement) => ({
    id: movement.id,
    type: movement.type,
    amount: Number(movement.amount),
    note: movement.note,
    createdAt: movement.createdAt,
  }));

  const cashSummary = calculateCashDrawerTotals({
    startingCash: currentShift ? Number(currentShift.startingCash) : 0,
    orders: allShiftOrders.map((order) => ({
      status: order.status,
      total: Number(order.total),
      cashReceived:
        order.cashReceived === null ? null : Number(order.cashReceived),
      cashChange: order.cashChange === null ? null : Number(order.cashChange),
      paymentType: order.paymentType,
    })),
    movements: localCashMovements,
  });
  const closedShifts = await prisma.shift.findMany({
    where: { status: "CLOSED" },
    include: {
      orders: {
        include: { paymentType: true },
      },
      cashMovements: true,
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

      <div className="staff-metrics-grid grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <CashMetricCard
          label="Starting cash"
          value={formatReceiptMoney(cashSummary.startingCash)}
        />
        <CashMetricCard
          label="Cash sales"
          value={formatReceiptMoney(cashSummary.salesTotal)}
        />
        <CashMetricCard
          label="Cash in"
          value={formatReceiptMoney(cashSummary.cashInTotal)}
        />
        <CashMetricCard
          label="Cash out"
          value={formatReceiptMoney(cashSummary.cashOutTotal)}
        />
        <CashMetricCard
          label="Expected cash"
          value={formatReceiptMoney(cashSummary.expectedCash)}
        />
        <CashMetricCard
          label="Change given"
          value={formatReceiptMoney(cashSummary.changeGivenTotal)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-primary" />
            Cash Movement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CashMovementForm disabled={!currentShift} />
          {!currentShift && (
            <p className="mt-3 text-sm text-muted-foreground">
              Open a shift before recording cash in or cash out.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="staff-report-grid grid gap-4 lg:grid-cols-[1fr_1fr_0.85fr]">
        <Card className="staff-cash-orders-card max-h-[calc(100dvh-15.75rem)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-primary" />
              Current Shift Cash Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="staff-cash-orders-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2">
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
                    className="staff-report-row grid gap-3 rounded-2xl border bg-card p-3 transition-colors hover:border-primary/50 hover:bg-accent/15 md:grid-cols-[1fr_auto_auto]"
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
                    <div className="staff-report-facts grid grid-cols-3 gap-2 rounded-2xl bg-muted/35 p-2 text-sm md:min-w-72">
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

        <Card className="staff-cash-movements-card max-h-[calc(100dvh-15.75rem)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-primary" />
              Cash Movement History
            </CardTitle>
          </CardHeader>
          <CardContent className="staff-cash-movements-scroll min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-2">
            {localCashMovements.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-muted/25 p-6 text-sm text-muted-foreground">
                {currentShift
                  ? "No manual cash movements recorded for this open shift."
                  : "Open a shift to start recording drawer movements."}
              </div>
            ) : (
              localCashMovements.map((movement) => (
                <div
                  key={movement.id}
                  className="rounded-2xl border bg-card p-3 text-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 font-semibold">
                      {movement.type === "CASH_IN" ? (
                        <ArrowDownToLine className="h-4 w-4 text-primary" />
                      ) : (
                        <ArrowUpFromLine className="h-4 w-4 text-destructive" />
                      )}
                      {movement.type === "CASH_IN" ? "Cash In" : "Cash Out"}
                    </div>
                    <p className="font-heading font-bold text-primary">
                      {formatReceiptMoney(movement.amount)}
                    </p>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatDateTime(movement.createdAt)}
                  </p>
                  {movement.note && (
                    <p className="mt-2 rounded-xl bg-muted/35 p-2">
                      {movement.note}
                    </p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="staff-closed-shifts-card max-h-[calc(100dvh-15.75rem)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-primary" />
              Closed Shift Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="staff-closed-shifts-scroll min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-2">
            {closedShifts.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-muted/25 p-4 text-sm text-muted-foreground">
                Closed shift reports will appear here after the first shift is
                closed.
              </div>
            ) : (
              closedShifts.map((shift) => {
                const totals = calculateCashDrawerTotals({
                  startingCash: Number(shift.startingCash),
                  orders: shift.orders.map((order) => ({
                    status: order.status,
                    total: Number(order.total),
                    cashReceived:
                      order.cashReceived === null
                        ? null
                        : Number(order.cashReceived),
                    cashChange:
                      order.cashChange === null
                        ? null
                        : Number(order.cashChange),
                    paymentType: order.paymentType,
                  })),
                  movements: shift.cashMovements.map((movement) => ({
                    type: movement.type,
                    amount: Number(movement.amount),
                  })),
                });

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
                        {formatReceiptMoney(
                          shift.actualCash === null
                            ? totals.expectedCash
                            : Number(shift.actualCash)
                        )}
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
