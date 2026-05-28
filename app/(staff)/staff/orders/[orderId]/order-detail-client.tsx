"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/staff/status-badge";
import { updateOrderStatus } from "@/app/actions/orders";
import { createReceiptAction, retryReceiptAction } from "@/app/actions/loyverse";
import {
  buildReceiptItemDescription,
  formatReceiptMoney,
} from "@/lib/orders/receipt-summary";
import { toast } from "sonner";
import { ArrowLeft, Clipboard, Printer, ReceiptText } from "lucide-react";
import Link from "next/link";

interface OrderDetailProps {
  order: {
    id: string;
    orderNumber: number;
    tableCode: string;
    customerName: string;
    status: string;
    subtotal: number;
    tax: number;
    total: number;
    loyverseReceiptNumber: string | null;
    loyverseSyncError: string | null;
    paymentType: { id: string; name: string } | null;
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
  };
}

export function OrderDetailView({ order }: OrderDetailProps) {
  const router = useRouter();
  const [syncedReceiptNumber, setSyncedReceiptNumber] = useState<string | null>(
    null
  );
  const receiptNumber = syncedReceiptNumber ?? order.loyverseReceiptNumber;

  async function handleStatusUpdate(newStatus: string) {
    const result = await updateOrderStatus(order.id, newStatus);
    if (result.success) {
      router.refresh();
      toast.success("Order status updated");
    } else {
      toast.error("Failed to update status");
    }
  }

  async function handlePayment(paymentTypeId: string) {
    const result = await createReceiptAction(order.id, paymentTypeId);
    if (result.success && result.data) {
      setSyncedReceiptNumber(result.data.receiptNumber);
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
      router.refresh();
      toast.success(`Receipt ${result.data.receiptNumber} synced`);
    } else {
      toast.error(result.error || "Retry failed");
      router.refresh();
    }
  }

  const statusTransitions: Record<string, Array<{ label: string; status: string; variant?: "default" | "destructive" }>> = {
    PENDING: [
      { label: "Accept Order", status: "ACCEPTED" },
      { label: "Cancel", status: "CANCELLED", variant: "destructive" },
    ],
    ACCEPTED: [
      { label: "Start Preparing", status: "PREPARING" },
      { label: "Cancel", status: "CANCELLED", variant: "destructive" },
    ],
    PREPARING: [{ label: "Ready for Payment", status: "AWAITING_PAYMENT" }],
  };

  const transitions = statusTransitions[order.status] || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-[0_4px_16px_rgba(51,51,51,0.05)] sm:flex-row sm:items-center">
        <Link href="/staff/orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="font-heading text-3xl font-bold">
            Order #{order.orderNumber}
          </h1>
          <p className="text-muted-foreground text-sm">
            Table {order.tableCode} &middot; {order.customerName} &middot;{" "}
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.items.map((oi) => (
                <div
                  key={oi.id}
                  className="flex justify-between gap-4 rounded-xl bg-muted/45 p-3"
                >
                  <div>
                    <span className="font-semibold">
                      {oi.quantity}x {oi.item.name}
                    </span>
                    {oi.variant && (
                      <span className="text-muted-foreground text-sm">
                        {" "}
                        ({oi.variant.name})
                      </span>
                    )}
                    {oi.modifiers.length > 0 && (
                      <span className="text-muted-foreground text-xs block">
                        + {oi.modifiers.map((m) => m.modifier.name).join(", ")}
                      </span>
                    )}
                    {oi.notes && (
                      <span className="text-muted-foreground text-xs block italic">
                        {oi.notes}
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-primary">
                    RM {(Number(oi.unitPrice) * oi.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>RM {Number(order.subtotal).toFixed(2)}</span>
              </div>
              {Number(order.tax) > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>RM {Number(order.tax).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-heading text-xl font-bold">
                <span>Total</span>
                <span className="text-primary">
                  RM {Number(order.total).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {transitions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {transitions.map((t) => (
                    <Button
                      key={t.status}
                      variant={t.variant || "default"}
                      onClick={() => handleStatusUpdate(t.status)}
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
            (order.status === "PAID_SYNC_FAILED" && !order.paymentType)) && (
            <PaymentSelector onPayment={handlePayment} />
          )}

          {/* Retry for failed syncs */}
          {order.status === "PAID_SYNC_FAILED" && order.paymentType && (
            <Card>
              <CardHeader>
                <CardTitle>Sync Failed</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.loyverseSyncError && (
                  <p className="text-sm text-destructive">
                    {order.loyverseSyncError}
                  </p>
                )}
                <Button onClick={handleRetry}>Retry Sync</Button>
              </CardContent>
            </Card>
          )}

          {receiptNumber && (
            <PrintableReceiptCard order={order} receiptNumber={receiptNumber} />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent>
              {order.paymentType ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Method</span>
                    <span className="font-semibold">
                      {order.paymentType.name}
                    </span>
                  </div>
                  {receiptNumber && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Receipt</span>
                      <span className="font-mono text-xs">
                        {receiptNumber}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Awaiting payment
                </p>
              )}
            </CardContent>
          </Card>

          {/* Sync Logs */}
          {order.syncLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Sync Log</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {order.syncLogs.map((log) => (
                  <div key={log.id} className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>{log.action}</span>
                      <span
                        className={
                          log.status === "success"
                            ? "text-green-600"
                            : "text-destructive"
                        }
                      >
                        {log.status}
                      </span>
                    </div>
                    {log.errorMessage && (
                      <p className="text-destructive">{log.errorMessage}</p>
                    )}
                    <p className="text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function PrintableReceiptCard({
  order,
  receiptNumber,
}: {
  order: OrderDetailProps["order"];
  receiptNumber: string;
}) {
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
    <Card className="print-receipt-area overflow-hidden">
      <CardHeader className="print-hide flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-primary" />
            Receipt
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Ready to print from this device
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyReceipt}>
            <Clipboard className="h-4 w-4" />
            Copy
          </Button>
          <Button size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mx-auto max-w-sm rounded-2xl border bg-white p-5 text-neutral-950 shadow-sm print:border-0 print:p-0 print:shadow-none">
          <div className="text-center">
            <p className="font-heading text-2xl font-bold">Olmosq Cafe</p>
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              QR Order Receipt
            </p>
          </div>

          <Separator className="my-4 bg-neutral-200" />

          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-neutral-500">Receipt</span>
              <span className="font-mono text-xs font-semibold">
                {receiptNumber}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Order</span>
              <span>#{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Table</span>
              <span>{order.tableCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Customer</span>
              <span>{order.customerName}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-neutral-500">Date</span>
              <span className="text-right">
                {new Date(order.createdAt).toLocaleString()}
              </span>
            </div>
            {order.paymentType && (
              <div className="flex justify-between">
                <span className="text-neutral-500">Payment</span>
                <span>{order.paymentType.name}</span>
              </div>
            )}
          </div>

          <Separator className="my-4 bg-neutral-200" />

          <div className="space-y-3">
            {order.items.map((oi) => (
              <div key={oi.id} className="grid grid-cols-[1fr_auto] gap-3">
                <div>
                  <p className="text-sm font-semibold">
                    {oi.quantity}x {buildReceiptItemDescription(oi)}
                  </p>
                  {oi.notes && (
                    <p className="text-xs italic text-neutral-500">
                      {oi.notes}
                    </p>
                  )}
                </div>
                <span className="text-sm font-semibold">
                  {formatReceiptMoney(Number(oi.unitPrice) * oi.quantity)}
                </span>
              </div>
            ))}
          </div>

          <Separator className="my-4 bg-neutral-200" />

          <div className="space-y-1 text-sm">
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
            <div className="flex justify-between pt-2 font-heading text-xl font-bold">
              <span>Total</span>
              <span>{formatReceiptMoney(Number(order.total))}</span>
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-neutral-500">
            Thank you. Please keep this receipt for reference.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentSelector({
  onPayment,
}: {
  onPayment: (paymentTypeId: string) => void;
}) {
  const [paymentTypes, setPaymentTypes] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Collect Payment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {paymentTypes.map((pt) => (
            <label
              key={pt.id}
              className={`flex cursor-pointer items-center rounded-xl border p-3 transition-colors ${
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
        <Button
          className="w-full"
          disabled={!selectedId}
          onClick={() => selectedId && onPayment(selectedId)}
        >
          Confirm Payment
        </Button>
      </CardContent>
    </Card>
  );
}
