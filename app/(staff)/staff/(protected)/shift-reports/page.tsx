import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpFromLine,
  ClipboardList,
  History,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { formatReceiptMoney } from "@/lib/orders/receipt-summary";
import { calculateCashDrawerTotals } from "@/lib/payments/cash-drawer";
import { getCurrentShift } from "@/lib/shifts/current-shift";

export const dynamic = "force-dynamic";

function formatDateTime(date: Date | string | null): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export default async function ShiftReportsPage() {
  const currentShift = await getCurrentShift();
  const currentShiftData = currentShift
    ? await prisma.shift.findUnique({
        where: { id: currentShift.id },
        include: {
          orders: { include: { paymentType: true } },
          cashMovements: { orderBy: { createdAt: "desc" } },
        },
      })
    : null;

  const closedShifts = await prisma.shift.findMany({
    where: { status: "CLOSED" },
    include: {
      orders: { include: { paymentType: true } },
      cashMovements: true,
    },
    orderBy: { closedAt: "desc" },
    take: 20,
  });

  const currentTotals = currentShiftData
    ? calculateCashDrawerTotals({
        startingCash: Number(currentShiftData.startingCash),
        orders: currentShiftData.orders.map((order) => ({
          status: order.status,
          total: Number(order.total),
          cashReceived:
            order.cashReceived === null ? null : Number(order.cashReceived),
          cashChange: order.cashChange === null ? null : Number(order.cashChange),
          paymentType: order.paymentType,
        })),
        movements: currentShiftData.cashMovements.map((movement) => ({
          type: movement.type,
          amount: Number(movement.amount),
        })),
      })
    : null;

  return (
    <div className="staff-page staff-shift-reports-page space-y-4">
      <div className="staff-page-header flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <Link href="/staff/cash-drawer">
            <Button variant="ghost" size="sm" className="-ml-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Shift
            </Button>
          </Link>
          <h1 className="staff-page-title font-heading text-3xl font-bold">
            Shift Reports
          </h1>
          <p className="staff-page-subtitle text-sm text-muted-foreground">
            Review drawer movement history and closed-shift cash reports.
          </p>
        </div>
      </div>

      <div className="staff-shift-reports-layout grid gap-4">
        <Card className="staff-current-movements-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Current Shift Movement History
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Manual cash in and cash out entries for the open shift.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentShiftData && currentTotals ? (
              <>
                <div className="staff-current-shift-summary grid gap-2">
                  <ReportMetric
                    label={`Shift ${currentShiftData.shiftNumber}`}
                    value={formatReceiptMoney(currentTotals.expectedCash)}
                    hint="Expected cash"
                  />
                  <ReportMetric
                    label="Cash in"
                    value={formatReceiptMoney(currentTotals.cashInTotal)}
                  />
                  <ReportMetric
                    label="Cash out"
                    value={formatReceiptMoney(currentTotals.cashOutTotal)}
                  />
                </div>

                {currentShiftData.cashMovements.length === 0 ? (
                  <div className="rounded-xl border border-dashed bg-muted/25 p-5 text-sm text-muted-foreground">
                    No manual cash movements recorded for this open shift.
                  </div>
                ) : (
                  <div className="staff-current-movements-list space-y-2">
                    {currentShiftData.cashMovements.map((movement) => (
                      <div
                        key={movement.id}
                        className="staff-cash-movement-row rounded-xl border bg-card p-3 text-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 font-semibold">
                            {movement.type === "CASH_IN" ? (
                              <ArrowDownToLine className="h-4 w-4 text-primary" />
                            ) : (
                              <ArrowUpFromLine className="h-4 w-4 text-destructive" />
                            )}
                            {movement.type === "CASH_IN"
                              ? "Cash In"
                              : "Cash Out"}
                          </div>
                          <p className="font-heading font-bold text-primary">
                            {formatReceiptMoney(Number(movement.amount))}
                          </p>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {formatDateTime(movement.createdAt)}
                        </p>
                        {movement.note && (
                          <p className="mt-2 rounded-lg bg-muted/35 p-2">
                            {movement.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-xl border border-dashed bg-muted/25 p-5 text-sm text-muted-foreground">
                Open a shift to start recording drawer movements.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="staff-closed-shifts-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Closed Shift Reports
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Cash reports are kept here after staff close a shift.
            </p>
          </CardHeader>
          <CardContent className="staff-closed-shifts-report-list space-y-3">
            {closedShifts.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-muted/25 p-5 text-sm text-muted-foreground">
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
                      order.cashChange === null ? null : Number(order.cashChange),
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
                    className="staff-closed-shift-row rounded-xl border bg-card p-3 text-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
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
                    <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-muted/35 p-2">
                      <ReportFact label="Orders" value={shift.orders.length} />
                      <ReportFact
                        label="Expected"
                        value={formatReceiptMoney(totals.expectedCash)}
                      />
                      <ReportFact
                        label="Moves"
                        value={shift.cashMovements.length}
                      />
                    </div>
                    <Link
                      className="mt-3 block"
                      href={`/staff/shift-reports/${shift.id}`}
                    >
                      <Button className="w-full" size="sm" variant="outline">
                        View Report
                      </Button>
                    </Link>
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

function ReportMetric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <p className="text-xs font-bold uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-heading text-xl font-bold text-primary">
        {value}
      </p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ReportFact({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
