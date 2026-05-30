"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { OrdersList } from "@/components/staff/orders-list";
import { buildOrderWebSocketUrl } from "@/lib/realtime/order-websocket-client";
import type { OrderRealtimeEvent } from "@/lib/realtime/order-events";

interface OrderData {
  id: string;
  orderNumber: number;
  shiftOrderNumber: number | null;
  tableCode: string;
  customerName: string;
  status: string;
  total: number;
  itemCount: number;
  createdAt: string;
}

const statusTabs = [
  { value: "ALL", label: "All" },
  { value: "AWAITING_PAYMENT", label: "Payment" },
  { value: "PREPARING", label: "Preparing" },
  { value: "DONE", label: "Done" },
  { value: "PAID_SYNCED_TO_LOYVERSE", label: "Paid" },
  { value: "PAID_SYNC_FAILED", label: "Failed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function OrdersPageClient({
  initialOrders,
  currentShift,
}: {
  initialOrders: OrderData[];
  currentShift: { id: string; shiftNumber: number; openedAt: string } | null;
}) {
  const [orders, setOrders] = useState<OrderData[]>(initialOrders);
  const [activeTab, setActiveTab] = useState("ALL");
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/staff/orders/api");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch {
      // Silent fail on refresh
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let socket: WebSocket | null = null;

    const connectTimer = window.setTimeout(() => {
      if (!isMounted) {
        return;
      }

      socket = new WebSocket(buildOrderWebSocketUrl({ scope: "staff" }));

      socket.onopen = () => {
        if (!isMounted) {
          return;
        }

        setIsSocketConnected(true);
        void refresh();
      };

      socket.onmessage = (message) => {
        try {
          const event = JSON.parse(message.data) as {
            staffOrder?: OrderRealtimeEvent["staffOrder"];
          };
          if (!event.staffOrder) {
            return;
          }

          const staffOrder = event.staffOrder;
          setOrders((current) => sortOrders(upsertOrder(current, staffOrder)));
        } catch {
          setIsSocketConnected(false);
        }
      };

      socket.onerror = () => {
        socket?.close();
      };

      socket.onclose = () => {
        if (isMounted) {
          setIsSocketConnected(false);
        }
      };
    }, 0);

    return () => {
      isMounted = false;
      window.clearTimeout(connectTimer);
      socket?.close();
    };
  }, [refresh]);

  useEffect(() => {
    if (isSocketConnected) {
      return;
    }

    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [isSocketConnected, refresh]);

  const filtered =
    activeTab === "ALL"
      ? orders
      : orders.filter((o) => o.status === activeTab);

  return (
    <div className="staff-page space-y-6">
      <div className="staff-page-header space-y-1">
        <div className="space-y-1">
          <h1 className="staff-page-title font-heading text-3xl font-bold">
            Orders
          </h1>
          <p className="staff-page-subtitle text-sm text-muted-foreground">
            {currentShift
              ? `Shift ${currentShift.shiftNumber} orders only. Collect counter payments, then move paid orders through prep.`
              : "Open a shift from the header to start taking orders."}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="staff-tabs-list flex max-w-full flex-nowrap justify-start gap-2 overflow-x-auto rounded-[1.35rem] bg-muted/35 p-1.5 ring-1 ring-border/60">
          {statusTabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="staff-tab-trigger min-w-16 flex-none shrink-0 border border-border/70 bg-card px-4 text-muted-foreground shadow-sm data-active:border-primary data-active:bg-primary data-active:text-primary-foreground data-active:shadow-[0_4px_12px_rgba(80,101,47,0.18)]"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {statusTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <OrdersList orders={filtered} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function upsertOrder(orders: OrderData[], order: OrderData) {
  const index = orders.findIndex((current) => current.id === order.id);
  if (index === -1) {
    return [order, ...orders];
  }

  return orders.map((current) => (current.id === order.id ? order : current));
}

function sortOrders(orders: OrderData[]) {
  return [...orders].sort((a, b) => {
    const aNumber = a.shiftOrderNumber ?? a.orderNumber;
    const bNumber = b.shiftOrderNumber ?? b.orderNumber;
    return bNumber - aNumber;
  });
}
