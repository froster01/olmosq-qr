import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BrandMark } from "@/components/brand-mark";
import { StatusBadge } from "@/components/staff/status-badge";

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
  item: { name: string };
  variant: { name: string } | null;
  modifiers: ConfirmationOrderModifier[];
};

export default async function ConfirmationPage({ params }: PageProps) {
  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          item: true,
          variant: true,
          modifiers: { include: { modifier: true } },
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background p-5">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-3 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-accent/35 text-primary">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="flex items-center justify-center gap-2">
              <BrandMark className="size-7" />
              <span className="font-heading font-bold text-primary">
                Olmosq Coffee
              </span>
            </div>
            <h1 className="font-heading text-3xl font-bold">
              Pay at Counter
            </h1>
            <p className="text-muted-foreground">
              Thank you, {order.customerName}. Show this order to the cashier.
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order #</span>
              <span className="font-mono font-bold">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Table</span>
              <span>{order.tableCode}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge status={order.status} />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-semibold text-muted-foreground">
            {["Payment", "Preparing", "Done"].map((step) => (
              <div key={step} className="space-y-2">
                <div className="h-1 rounded-full bg-accent" />
                <span>{step}</span>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Order Summary</h3>
            {order.items.map((oi: ConfirmationOrderItem) => (
              <div
                key={oi.id}
                className="flex justify-between gap-4 rounded-xl bg-muted/45 p-3 text-sm"
              >
                <div className="flex-1">
                  <span className="font-semibold">
                    {oi.quantity}x {oi.item.name}
                  </span>
                  {oi.variant && (
                    <span className="text-muted-foreground">
                      {" "}
                      ({oi.variant.name})
                    </span>
                  )}
                  {oi.modifiers.length > 0 && (
                    <span className="text-muted-foreground text-xs block">
                      +{" "}
                      {oi.modifiers
                        .map((m: ConfirmationOrderModifier) => m.modifier.name)
                        .join(", ")}
                    </span>
                  )}
                </div>
                <span className="font-bold text-primary">
                  RM {(Number(oi.unitPrice) * oi.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <Separator />

          <div className="flex justify-between font-heading text-xl font-bold">
            <span>Total</span>
            <span className="text-primary">RM {Number(order.total).toFixed(2)}</span>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Please pay at the counter. Your order will be prepared after staff
            confirms payment.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
