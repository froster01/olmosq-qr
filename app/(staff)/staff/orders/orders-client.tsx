"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { OrdersList } from "@/components/staff/orders-list";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrderStatus } from "@prisma/client";

interface OrderData {
  id: string;
  orderNumber: number;
  tableCode: string;
  customerName: string;
  status: OrderStatus;
  total: number;
  itemCount: number;
  createdAt: string;
}

const statusTabs = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "PREPARING", label: "Preparing" },
  { value: "AWAITING_PAYMENT", label: "Payment" },
  { value: "PAID_SYNCED_TO_LOYVERSE", label: "Paid" },
  { value: "PAID_SYNC_FAILED", label: "Failed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function OrdersPageClient({
  initialOrders,
}: {
  initialOrders: OrderData[];
}) {
  const [orders, setOrders] = useState<OrderData[]>(initialOrders);
  const [activeTab, setActiveTab] = useState("ALL");
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/staff/orders/api");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch {
      // Silent fail on refresh
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  const filtered =
    activeTab === "ALL"
      ? orders
      : orders.filter((o) => o.status === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-3xl font-bold">Orders</h1>
            <span className="rounded-full bg-accent/35 px-3 py-1 text-xs font-semibold text-accent-foreground">
              Live
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Track table orders from scan to payment.
          </p>
        </div>
        <Button variant="outline" onClick={refresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh Feed
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex justify-start overflow-x-auto bg-transparent p-0">
          {statusTabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="shrink-0 border border-border bg-card"
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
