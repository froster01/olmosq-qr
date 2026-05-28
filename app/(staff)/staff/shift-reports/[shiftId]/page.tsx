import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpFromLine,
  Banknote,
  ClipboardList,
  ReceiptText,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/staff/status-badge";
import { getShiftById } from "@/lib/shifts/current-shift";
import { formatOrderDisplayNumber } from "@/lib/shifts/shift-rules";
import { summarizeShiftReport } from "@/lib/shifts/shift-report";
import { formatReceiptMoney } from "@/lib/orders/receipt-summary";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ shiftId: string }>;
}

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

export default async function ShiftReportPage({ params }: PageProps) {
  const { shiftId } = await params;
  const shift = await getShiftById(shiftId);

  if (!shift || shift.status !== "CLOSED") {
    notFound();
  }

  const reportOrders = shift.orders.map((order) => ({
    shiftId: order.shiftId,
    status: order.status,
    total: Number(order.total),
    cashReceived:
      order.cashReceived === null ? null : Number(order.cashReceived),
    cashChange: order.cashChange === null ? null : Number(order.cashChange),
    paymentType: order.paymentType,
  }));
  const summary = summarizeShiftReport({
    shiftId: shift.id,
    startingCash: Number(shift.startingCash),
    actualCash: shift.actualCash === null ? null : Number(shift.actualCash),
    orders: reportOrders,
    movements: shift.cashMovements.map((movement) => ({
      shiftId: movement.shiftId,
      type: movement.type,
      amount: Number(movement.amount),
    })),
  });

  return (
    <div className="staff-page space-y-6">
      <div className="staff-detail-header flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-[0_4px_16px_rgba(51,51,51,0.05)] sm:flex-row sm:items-center">
        <Link href="/staff/cash-drawer">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="staff-page-title font-heading text-3xl font-bold">
            Shift {shift.shiftNumber} Report
          </h1>
          <p className="staff-page-subtitle text-sm text-muted-foreground">
            {formatDateTime(shift.openedAt)} - {formatDateTime(shift.closedAt)}
          </p>
        </div>
        <div className="rounded-full bg-muted px-3 py-1 text-sm font-semibold text-muted-foreground">
          Closed
        </div>
      </div>

      <div className="staff-metrics-grid grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Gross sales"
          value={formatReceiptMoney(summary.grossSales)}
        />
        <MetricCard label="Orders" value={summary.orderCount.toString()} />
        <MetricCard
          label="Starting cash"
          value={formatReceiptMoney(summary.startingCash)}
        />
        <MetricCard
          label="Cash sales"
          value={formatReceiptMoney(summary.cashSales)}
        />
        <MetricCard label="Cash in" value={formatReceiptMoney(summary.cashIn)} />
        <MetricCard
          label="Cash out"
          value={formatReceiptMoney(summary.cashOut)}
        />
        <MetricCard
          label="Expected cash"
          value={formatReceiptMoney(summary.expectedCash)}
        />
        <MetricCard
          label="Actual cash"
          value={
            summary.actualCash === null
              ? "-"
              : formatReceiptMoney(summary.actualCash)
          }
        />
        <MetricCard
          label="Variance"
          value={
            summary.cashVariance === null
              ? "-"
              : formatReceiptMoney(summary.cashVariance)
          }
        />
      </div>

      <div className="staff-report-grid grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {shift.orders.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-muted/25 p-6 text-sm text-muted-foreground">
                No orders were created in this shift.
              </div>
            ) : (
              <div className="space-y-2">
                {shift.orders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/staff/orders/${order.id}`}
                    className="staff-report-row grid gap-3 rounded-2xl border bg-card p-3 transition-colors hover:border-primary/50 hover:bg-accent/15 md:grid-cols-[1fr_auto_auto]"
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
                        {order.customerName} &middot;{" "}
                        {formatTime(order.createdAt)}
                      </p>
                    </div>
                    <div className="staff-report-facts grid grid-cols-3 gap-2 rounded-2xl bg-muted/35 p-2 text-sm md:min-w-72">
                      <ReportLine
                        label="Total"
                        value={formatReceiptMoney(Number(order.total))}
                      />
                      <ReportLine
                        label="Paid"
                        value={order.paidAt ? formatTime(order.paidAt) : "-"}
                      />
                      <ReportLine
                        label="Method"
                        value={order.paymentType?.name ?? "-"}
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

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-primary" />
                Payment Totals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {summary.paymentTypeTotals.length === 0 ? (
                <p className="text-muted-foreground">No paid orders.</p>
              ) : (
                summary.paymentTypeTotals.map((payment) => (
                  <SummaryLine
                    key={payment.name}
                    label={payment.name}
                    value={formatReceiptMoney(payment.total)}
                  />
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ReceiptText className="h-5 w-5 text-primary" />
                Status Counts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {summary.statusCounts.map((status) => (
                <SummaryLine
                  key={status.status}
                  label={status.status.replaceAll("_", " ")}
                  value={status.count.toString()}
                />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-primary" />
                Cash Movements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {shift.cashMovements.length === 0 ? (
                <p className="text-muted-foreground">No manual cash movements.</p>
              ) : (
                shift.cashMovements.map((movement) => (
                  <div
                    key={movement.id}
                    className="rounded-2xl border bg-card p-3"
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
                      <span className="font-semibold">
                        {formatReceiptMoney(Number(movement.amount))}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
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

          {shift.closedNote && (
            <Card>
              <CardHeader>
                <CardTitle>Closing Note</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {shift.closedNote}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
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

function ReportLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
