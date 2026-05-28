import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Coffee, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ orderId: string }>;
}

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
    <div className="min-h-dvh flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 space-y-6">
          <div className="text-center space-y-2">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <div className="flex items-center justify-center gap-2">
              <Coffee className="h-5 w-5" />
              <span className="font-semibold">Olmosq Coffee</span>
            </div>
            <h1 className="text-2xl font-bold">Order Placed!</h1>
            <p className="text-muted-foreground">
              Thank you, {order.customerName}!
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
              <span className="capitalize">{order.status.toLowerCase().replace(/_/g, " ")}</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="font-medium text-sm">Order Summary</h3>
            {order.items.map((oi) => (
              <div key={oi.id} className="flex justify-between text-sm">
                <div className="flex-1">
                  <span>
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
                      + {oi.modifiers.map((m) => m.modifier.name).join(", ")}
                    </span>
                  )}
                </div>
                <span>RM {(Number(oi.unitPrice) * oi.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <Separator />

          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>RM {Number(order.total).toFixed(2)}</span>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Your order has been sent to the kitchen. Please wait while we
            prepare your order.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
