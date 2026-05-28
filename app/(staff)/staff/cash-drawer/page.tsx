import { AlertCircle, Banknote, Clock, ReceiptText } from "lucide-react";
import Link from "next/link";

import { prisma } from "@/lib/db";
import { fetchLatestLoyverseShiftSnapshot } from "@/lib/loyverse/shifts";
import { formatReceiptMoney } from "@/lib/orders/receipt-summary";
import { summarizeCashDrawer } from "@/lib/payments/cash-drawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/staff/status-badge";

export const dynamic = "force-dynamic";

function formatTime(date: Date | string | null): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatShiftWindow(start: Date | string | null, end: Date): string {
  if (!start) return "No open shift";
  return `${new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(start))} - ${formatTime(end)}`;
}

export default async function CashDrawerPage() {
  const now = new Date();
  let shiftError: string | null = null;
  let shiftSnapshot: Awaited<
    ReturnType<typeof fetchLatestLoyverseShiftSnapshot>
  > = {
    openShift: null,
    latestClosedShift: null,
  };

  try {
    shiftSnapshot = await fetchLatestLoyverseShiftSnapshot();
  } catch (error) {
    shiftError = error instanceof Error ? error.message : "Unknown error";
  }

  const shiftStart = shiftSnapshot.openShift
    ? new Date(shiftSnapshot.openShift.opened_at)
    : shiftSnapshot.latestClosedShift?.closed_at
      ? new Date(shiftSnapshot.latestClosedShift.closed_at)
      : null;
  const usingClosedShiftFallback =
    !shiftSnapshot.openShift && shiftSnapshot.latestClosedShift !== null;

  const cashOrders = shiftStart
    ? await prisma.order.findMany({
        where: {
          paidAt: { gte: shiftStart, lte: now },
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

  const loyverseCashPayments =
    shiftSnapshot.openShift?.cash_payments ??
    shiftSnapshot.latestClosedShift?.cash_payments ??
    0;
  const loyverseExpectedCash =
    shiftSnapshot.openShift?.expected_cash ??
    shiftSnapshot.latestClosedShift?.expected_cash ??
    0;
  const adjustedExpectedCash =
    loyverseExpectedCash + cashSummary.expectedCashImpact;

  return (
    <div className="staff-page space-y-6">
      <div className="staff-page-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="staff-page-title font-heading text-4xl font-bold">
            Cash Drawer
          </h1>
          <p className="staff-page-subtitle text-muted-foreground">
            Physical cash payments for the current cashier shift.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground">
          <Clock className="h-4 w-4 text-primary" />
          {usingClosedShiftFallback
            ? `Current shift estimate: ${formatShiftWindow(shiftStart, now)}`
            : formatShiftWindow(shiftStart, now)}
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

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-primary" />
              Cash Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {localCashOrders.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-muted/25 p-6 text-sm text-muted-foreground">
                {shiftSnapshot.openShift
                  ? "No physical cash payments recorded for this open shift."
                  : usingClosedShiftFallback
                    ? "No physical cash payments recorded since the last closed Loyverse shift."
                    : "Open a shift in Loyverse POS to start tracking physical cash here."}
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
                        Order #{order.orderNumber}
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
              Loyverse Shift Check
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {shiftError ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <div className="mb-1 flex items-center gap-2 font-semibold">
                  <AlertCircle className="h-4 w-4" />
                  Loyverse shifts unavailable
                </div>
                <p>{shiftError}</p>
              </div>
            ) : (
              <div className="rounded-2xl border bg-muted/25 p-3 text-sm text-muted-foreground">
                {shiftSnapshot.openShift
                  ? `Open shift ${shiftSnapshot.openShift.id} is being used.`
                  : usingClosedShiftFallback
                    ? "Loyverse API does not return the current open shift, so this page is using the last closed shift as the starting point."
                    : "No Loyverse shift snapshot found."}
              </div>
            )}

            <div className="space-y-2 text-sm">
              <ReconcileLine
                label="Loyverse cash payments"
                value={formatReceiptMoney(loyverseCashPayments)}
              />
              <ReconcileLine
                label="Loyverse expected cash"
                value={formatReceiptMoney(loyverseExpectedCash)}
              />
              <ReconcileLine
                label="Add physical cash sales"
                value={formatReceiptMoney(cashSummary.expectedCashImpact)}
              />
              <div className="mt-3 rounded-2xl bg-accent/35 p-3">
                <ReconcileLine
                  label="Adjusted expected cash"
                  value={formatReceiptMoney(adjustedExpectedCash)}
                  strong
                />
              </div>
            </div>
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

function ReconcileLine({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 ${
        strong ? "font-heading text-lg font-bold" : ""
      }`}
    >
      <span className={strong ? "" : "text-muted-foreground"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
