"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/staff/status-badge";
import { updateOrderStatus } from "@/app/actions/orders";
import { createReceiptAction, retryReceiptAction } from "@/app/actions/loyverse";
import {
  buildReceiptItemDescription,
  formatReceiptMoney,
} from "@/lib/orders/receipt-summary";
import { getStaffStatusActions } from "@/lib/orders/status-flow";
import { calculateCashChange } from "@/lib/payments/cash-change";
import { isCashPaymentType } from "@/lib/payments/cash-drawer";
import { formatOrderDisplayNumber } from "@/lib/shifts/shift-rules";
import { toast } from "sonner";
import { ArrowLeft, Clipboard, Printer, ReceiptText } from "lucide-react";
import Link from "next/link";

interface OrderDetailProps {
  order: {
    id: string;
    orderNumber: number;
    shiftOrderNumber: number | null;
    tableCode: string;
    customerName: string;
    status: string;
    subtotal: number;
    tax: number;
    total: number;
    paidAt: string | null;
    cashReceived: number | null;
    cashChange: number | null;
    loyverseReceiptNumber: string | null;
    loyverseSyncError: string | null;
    paymentType: { id: string; name: string; type: string } | null;
    items: Array<{
      id: string;
      quantity: number;
      unitPrice: number;
      notes: string | null;
      item: { id: string; name: string };
      variant: { id: string; name: string } | null;
      modifiers: Array<{ modifier: { id: string; name: string } }>;
    }>;
    syncLogs: Array<{
      id: string;
      action: string;
      status: string;
      errorMessage: string | null;
      createdAt: string;
    }>;
    createdAt: string;
    canEdit: boolean;
  };
}

interface CashPaymentSummary {
  received: number;
  change: number;
  total: number;
}

export function OrderDetailView({ order }: OrderDetailProps) {
  const router = useRouter();
  const [syncedReceiptNumber, setSyncedReceiptNumber] = useState<string | null>(
    null
  );
  const [cashPaymentSummary, setCashPaymentSummary] =
    useState<CashPaymentSummary | null>(() =>
      order.cashReceived === null || order.cashChange === null
        ? null
        : {
            received: order.cashReceived,
            change: order.cashChange,
            total: Number(order.total),
          }
    );
  const receiptNumber = syncedReceiptNumber ?? order.loyverseReceiptNumber;
  const displayNumber = formatOrderDisplayNumber({
    shiftOrderNumber: order.shiftOrderNumber,
    orderNumber: order.orderNumber,
  });

  async function handleStatusUpdate(newStatus: string) {
    const result = await updateOrderStatus(order.id, newStatus);
    if (result.success) {
      router.refresh();
      toast.success("Order status updated");
    } else {
      toast.error(result.error || "Failed to update status");
    }
  }

  async function handlePayment(
    paymentTypeId: string,
    cashPayment?: CashPaymentSummary
  ) {
    const result = await createReceiptAction(
      order.id,
      paymentTypeId,
      cashPayment?.received
    );
    if (result.success && result.data) {
      setSyncedReceiptNumber(result.data.receiptNumber);
      setCashPaymentSummary(
        result.data.cashPayment.cashReceived === null ||
          result.data.cashPayment.cashChange === null
          ? null
          : {
              received: result.data.cashPayment.cashReceived,
              change: result.data.cashPayment.cashChange,
              total: Number(order.total),
            }
      );
      router.refresh();
      toast.success(`Receipt ${result.data.receiptNumber} synced`);
    } else {
      toast.error(result.error || "Payment sync failed");
      router.refresh();
    }
  }

  async function handleRetry() {
    const result = await retryReceiptAction(order.id);
    if (result.success && result.data) {
      setSyncedReceiptNumber(result.data.receiptNumber);
      setCashPaymentSummary(
        result.data.cashPayment.cashReceived === null ||
          result.data.cashPayment.cashChange === null
          ? null
          : {
              received: result.data.cashPayment.cashReceived,
              change: result.data.cashPayment.cashChange,
              total: Number(order.total),
            }
      );
      router.refresh();
      toast.success(`Receipt ${result.data.receiptNumber} synced`);
    } else {
      toast.error(result.error || "Retry failed");
      router.refresh();
    }
  }

  const transitions = order.canEdit
    ? getStaffStatusActions(order.status).filter(
        (action) => action.nextStatus !== "AWAITING_PAYMENT"
      )
    : [];

  return (
    <div className="staff-detail-page space-y-3">
      <div className="staff-detail-header flex items-center gap-3 rounded-xl border bg-card p-3 shadow-[0_4px_16px_rgba(51,51,51,0.05)]">
        <Link href="/staff/orders">
          <Button variant="ghost" size="sm" className="h-7 px-2">
            <ArrowLeft className="h-3.5 w-3.5 mr-0.5" />
            Back
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="staff-page-title font-heading text-xl font-bold leading-tight truncate">
              Order {displayNumber}
            </h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="staff-page-subtitle text-muted-foreground text-xs leading-snug truncate">
            Table {order.tableCode} &middot; {order.customerName} &middot;{" "}
            {formatStaffDateTime(order.createdAt)}
          </p>
        </div>
      </div>

      {!order.canEdit && (
        <Card size="sm" className="border-muted bg-muted/25">
          <CardContent className="p-3 text-xs text-muted-foreground">
            This order belongs to a closed shift. Report-only.
          </CardContent>
        </Card>
      )}

      <div className="staff-order-detail-grid grid gap-3">
        {/* Main content */}
        <div className="staff-order-detail-main space-y-3">
          {/* Order Items */}
          <Card size="sm">
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {order.items.map((oi) => (
                <div
                  key={oi.id}
                  className="flex justify-between gap-3 rounded-lg bg-muted/45 px-3 py-2"
                >
                  <div className="min-w-0">
                    <span className="text-sm font-semibold">
                      {oi.quantity}x {oi.item.name}
                    </span>
                    {oi.modifiers.length > 0 && (
                      <span className="text-muted-foreground text-xs block leading-tight">
                        + {oi.modifiers.map((m) => m.modifier.name).join(", ")}
                      </span>
                    )}
                    {oi.notes && (
                      <span className="block whitespace-pre-line text-xs italic text-muted-foreground leading-tight">
                        {oi.notes}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-primary shrink-0">
                    RM {(Number(oi.unitPrice) * oi.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
              <Separator className="my-1" />
              <div className="flex justify-between text-xs">
                <span>Subtotal</span>
                <span>RM {Number(order.subtotal).toFixed(2)}</span>
              </div>
              {Number(order.tax) > 0 && (
                <div className="flex justify-between text-xs">
                  <span>Tax</span>
                  <span>RM {Number(order.tax).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-heading text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">
                  RM {Number(order.total).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {transitions.length > 0 && (
            <Card size="sm">
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {transitions.map((t) => (
                    <Button
                      key={t.nextStatus}
                      variant={t.variant || "default"}
                      size="sm"
                      onClick={() => handleStatusUpdate(t.nextStatus)}
                    >
                      {t.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Collection (for AWAITING_PAYMENT status) */}
          {(order.status === "AWAITING_PAYMENT" ||
            (order.status === "PAID_SYNC_FAILED" && !order.paymentType)) &&
            order.canEdit && (
            <PaymentSelector
              total={Number(order.total)}
              onPayment={handlePayment}
            />
          )}

          {/* Retry for failed syncs */}
          {order.canEdit &&
            order.loyverseSyncError &&
            order.paymentType &&
            !receiptNumber && (
            <Card size="sm">
              <CardHeader>
                <CardTitle>Sync Failed</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {order.loyverseSyncError && (
                  <p className="text-xs text-destructive">
                    {order.loyverseSyncError}
                  </p>
                )}
                <Button size="sm" onClick={handleRetry}>Retry Sync</Button>
              </CardContent>
            </Card>
          )}

        </div>

        {/* Sidebar */}
        <div className="staff-order-detail-sidebar space-y-3">
          {/* Payment Info */}
          <Card size="sm" className="staff-order-payment-card">
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent>
              {order.paymentType ? (
                <div className="space-y-1 text-[0.8rem]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Method</span>
                    <span className="font-semibold">
                      {order.paymentType.name}
                    </span>
                  </div>
                  {receiptNumber && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Receipt</span>
                      <span className="font-mono text-[0.65rem]">
                        {receiptNumber}
                      </span>
                    </div>
                  )}
                  {cashPaymentSummary && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cash</span>
                        <span className="font-semibold">
                          {formatReceiptMoney(cashPaymentSummary.received)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Change</span>
                        <span className="font-semibold text-primary">
                          {formatReceiptMoney(cashPaymentSummary.change)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Awaiting payment
                </p>
              )}
            </CardContent>
          </Card>

          {receiptNumber && (
            <PrintableReceiptCard
              order={order}
              receiptNumber={receiptNumber}
              cashPayment={cashPaymentSummary}
            />
          )}

        </div>
      </div>
    </div>
  );
}

function PrintableReceiptCard({
  order,
  receiptNumber,
  cashPayment,
}: {
  order: OrderDetailProps["order"];
  receiptNumber: string;
  cashPayment: CashPaymentSummary | null;
}) {
  const displayNumber = formatOrderDisplayNumber({
    shiftOrderNumber: order.shiftOrderNumber,
    orderNumber: order.orderNumber,
  });

  async function handleCopyReceipt() {
    try {
      await navigator.clipboard.writeText(receiptNumber);
      toast.success("Receipt number copied");
    } catch {
      toast.error("Could not copy receipt number");
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <Card size="sm" className="print-receipt-area overflow-hidden">
      <CardHeader className="print-hide flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-1.5">
          <ReceiptText className="h-4 w-4 text-primary" />
          Receipt
        </CardTitle>
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={handleCopyReceipt}>
            <Clipboard className="h-3.5 w-3.5" />
            Copy
          </Button>
          <Button size="sm" className="h-7 px-2 text-xs" onClick={handlePrint}>
            <Printer className="h-3.5 w-3.5" />
            Print
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mx-auto max-w-sm rounded-xl border bg-white p-3 text-neutral-950 shadow-sm print:border-0 print:p-0 print:shadow-none">
          <div className="text-center">
            <p className="font-heading text-xl font-bold">Olmosq Coffee</p>
            <p className="text-[0.65rem] uppercase tracking-wide text-neutral-500">
              QR Order Receipt
            </p>
          </div>

          <Separator className="my-3 bg-neutral-200" />

          <div className="space-y-0.5 text-xs">
            <div className="flex justify-between gap-3">
              <span className="text-neutral-500">Receipt</span>
              <span className="font-mono text-[0.65rem] font-semibold">
                {receiptNumber}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Order</span>
              <span>{displayNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Table</span>
              <span>{order.tableCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Customer</span>
              <span>{order.customerName}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-neutral-500">Date</span>
              <span className="text-right">
                {formatStaffDateTime(order.createdAt)}
              </span>
            </div>
            {order.paymentType && (
              <div className="flex justify-between">
                <span className="text-neutral-500">Payment</span>
                <span>{order.paymentType.name}</span>
              </div>
            )}
            {cashPayment && (
              <>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Cash received</span>
                  <span>{formatReceiptMoney(cashPayment.received)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Change</span>
                  <span>{formatReceiptMoney(cashPayment.change)}</span>
                </div>
              </>
            )}
          </div>

          <Separator className="my-3 bg-neutral-200" />

          <div className="space-y-1.5">
            {order.items.map((oi) => (
              <div key={oi.id} className="grid grid-cols-[1fr_auto] gap-2">
                <div>
                  <p className="text-xs font-semibold">
                    {oi.quantity}x {buildReceiptItemDescription(oi)}
                  </p>
                  {oi.notes && (
                    <p className="whitespace-pre-line text-[0.65rem] italic text-neutral-500 leading-tight">
                      {oi.notes}
                    </p>
                  )}
                </div>
                <span className="text-xs font-semibold">
                  {formatReceiptMoney(Number(oi.unitPrice) * oi.quantity)}
                </span>
              </div>
            ))}
          </div>

          <Separator className="my-3 bg-neutral-200" />

          <div className="space-y-0.5 text-xs">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatReceiptMoney(Number(order.subtotal))}</span>
            </div>
            {Number(order.tax) > 0 && (
              <div className="flex justify-between">
                <span>Tax</span>
                <span>{formatReceiptMoney(Number(order.tax))}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 font-heading text-base font-bold">
              <span>Total</span>
              <span>{formatReceiptMoney(Number(order.total))}</span>
            </div>
          </div>

          <p className="mt-3 text-center text-[0.65rem] text-neutral-500">
            Thank you. Please keep this receipt for reference.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function formatStaffDateTime(value: string) {
  return new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function PaymentSelector({
  total,
  onPayment,
}: {
  total: number;
  onPayment: (paymentTypeId: string, cashPayment?: CashPaymentSummary) => void;
}) {
  const [paymentTypes, setPaymentTypes] = useState<
    Array<{ id: string; name: string; type: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cashReceived, setCashReceived] = useState("");

  useEffect(() => {
    async function fetchPaymentTypes() {
      try {
        const res = await fetch("/api/payment-types");
        if (res.ok) {
          const data = await res.json();
          setPaymentTypes(data);
          if (data.length > 0) setSelectedId(data[0].id);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchPaymentTypes();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">Loading payment types...</CardContent>
      </Card>
    );
  }

  const selectedPaymentType = paymentTypes.find((pt) => pt.id === selectedId);
  const isCashPayment =
    selectedPaymentType !== undefined && isCashPaymentType(selectedPaymentType);
  const cashReceivedNumber = Number(cashReceived);
  const hasCashReceived =
    cashReceived.trim() !== "" && Number.isFinite(cashReceivedNumber);
  const cashChange = hasCashReceived
    ? calculateCashChange({ total, received: cashReceivedNumber })
    : null;
  const canConfirmCashPayment =
    !isCashPayment || (cashChange !== null && cashChange.isEnough);
  const cashPaymentSummary =
    isCashPayment && cashChange
      ? {
          received: cashReceivedNumber,
          change: cashChange.change,
          total,
        }
      : undefined;

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Collect Payment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="space-y-1.5">
          {paymentTypes.map((pt) => (
            <label
              key={pt.id}
              className={`flex cursor-pointer items-center rounded-lg border px-3 py-2 transition-colors ${
                selectedId === pt.id
                  ? "border-primary bg-accent/35"
                  : "bg-card hover:bg-muted"
              }`}
            >
              <input
                type="radio"
                name="paymentType"
                value={pt.id}
                checked={selectedId === pt.id}
                onChange={() => setSelectedId(pt.id)}
                className="sr-only"
              />
              <span className="text-sm">{pt.name}</span>
            </label>
          ))}
        </div>
        {isCashPayment && (
          <div className="rounded-lg border bg-muted/35 p-2.5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold">Cash received</p>
                <p className="text-[0.65rem] text-muted-foreground">
                  Due: {formatReceiptMoney(total)}
                </p>
              </div>
              {cashChange?.isEnough && (
                <div className="rounded-full bg-accent/40 px-2 py-0.5 text-[0.65rem] font-semibold text-accent-foreground">
                  Change {formatReceiptMoney(cashChange.change)}
                </div>
              )}
            </div>
            <Input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={cashReceived}
              onChange={(event) => setCashReceived(event.target.value)}
              placeholder="Enter cash amount"
              className="h-9 text-sm"
            />
            {cashChange && !cashChange.isEnough && (
              <p className="mt-1.5 text-[0.65rem] font-semibold text-destructive">
                Short {formatReceiptMoney(cashChange.remaining)}
              </p>
            )}
          </div>
        )}
        <Button
          className="w-full h-9 text-sm"
          disabled={!selectedId || !canConfirmCashPayment}
          onClick={() => selectedId && onPayment(selectedId, cashPaymentSummary)}
        >
          Confirm Payment
        </Button>
      </CardContent>
    </Card>
  );
}
