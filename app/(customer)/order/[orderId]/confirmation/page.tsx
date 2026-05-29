import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { CheckCircle2, ReceiptText, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { BrandMark } from "@/components/brand-mark";
import { formatOrderDisplayNumber } from "@/lib/shifts/shift-rules";
import { OrderLiveTracker } from "@/components/customer/order-live-tracker";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ orderId: string }>;
}

type ConfirmationOrderModifier = {
  modifier: { name: string };
};

type ConfirmationOrderItem = {
  id: string;
  quantity: number;
  unitPrice: unknown;
  notes: string | null;
  item: { name: string };
  modifiers: ConfirmationOrderModifier[];
};

function parseOrderItemNotes(notes: string | null) {
  if (!notes) {
    return { option: null, request: null };
  }

  const lines = notes
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  let option: string | null = null;
  const requestLines: string[] = [];

  for (const line of lines) {
    if (line.toLowerCase().startsWith("option:")) {
      option = line.slice(line.indexOf(":") + 1).trim();
      continue;
    }

    if (line.toLowerCase().startsWith("special request:")) {
      requestLines.push(line.slice(line.indexOf(":") + 1).trim());
      continue;
    }

    requestLines.push(line);
  }

  return {
    option,
    request: requestLines.join(" "),
  };
}

export default async function ConfirmationPage({ params }: PageProps) {
  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          item: true,
          modifiers: { include: { modifier: true } },
        },
      },
    },
  });

  if (!order) {
    notFound();
  }
  const displayNumber = formatOrderDisplayNumber({
    shiftOrderNumber: order.shiftOrderNumber,
    orderNumber: order.orderNumber,
  });
  const total = Number(order.total);

  return (
    <div className="customer-confirmation-page flex min-h-dvh flex-col items-center bg-background p-4">
      <Card className="customer-confirmation-card w-full max-w-md overflow-hidden">
        <CardContent className="p-0">
          <section className="customer-confirmation-hero">
            <div className="customer-confirmation-brand-row">
              <div className="flex min-w-0 items-center gap-2">
                <BrandMark className="size-8" />
                <span className="truncate font-heading font-bold text-primary">
                  Olmosq Coffee
                </span>
              </div>
              <span className="customer-confirmation-pay-chip">
                <Wallet className="h-3.5 w-3.5" />
                Counter pay
              </span>
            </div>

            <div className="customer-confirmation-status-mark">
              <CheckCircle2 className="h-7 w-7" />
            </div>

            <div className="customer-confirmation-heading">
              <p>Thanks, {order.customerName}</p>
              <h1>Show this ticket</h1>
              <span>Cashier will collect payment before preparation starts.</span>
            </div>

            <div className="customer-confirmation-ticket">
              <div>
                <span>Order</span>
                <strong>{displayNumber}</strong>
              </div>
              <div>
                <span>Table</span>
                <strong>{order.tableCode}</strong>
              </div>
            </div>
          </section>

          <OrderLiveTracker
            orderId={order.id}
            initialStatus={order.status}
            initialUpdatedAt={order.updatedAt.toISOString()}
          />

          <section className="customer-confirmation-section">
            <div className="customer-confirmation-section-title">
              <ReceiptText className="h-4 w-4" />
              Order summary
            </div>

            {order.items.map((oi: ConfirmationOrderItem) => {
              const itemNotes = parseOrderItemNotes(oi.notes);

              return (
                <div key={oi.id} className="customer-confirmation-item">
                  <div>
                    <p>
                      {oi.quantity}x {oi.item.name}
                    </p>
                    <div className="customer-confirmation-item-options">
                      {itemNotes.option && (
                        <span className="customer-confirmation-option-badge">
                          <span>{itemNotes.option}</span>
                        </span>
                      )}
                      {oi.modifiers.length > 0 && (
                        <span className="customer-confirmation-option-badge">
                          <span>
                          {oi.modifiers
                            .map(
                              (m: ConfirmationOrderModifier) => m.modifier.name
                            )
                            .join(", ")}
                          </span>
                        </span>
                      )}
                    </div>
                    {itemNotes.request && (
                      <span className="customer-confirmation-item-note">
                        Request: {itemNotes.request}
                      </span>
                    )}
                  </div>
                  <strong>
                    RM {(Number(oi.unitPrice) * oi.quantity).toFixed(2)}
                  </strong>
                </div>
              );
            })}
          </section>

          <section className="customer-confirmation-total">
            <div>
              <span>Total to pay</span>
              <strong>RM {total.toFixed(2)}</strong>
            </div>
            <p>Please show this screen to the cashier.</p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
