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
  { value: "AWAITING_PAYMENT", label: "Payment" },
  { value: "PREPARING", label: "Preparing" },
  { value: "DONE", label: "Done" },
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
    <div className="staff-page space-y-6">
      <div className="staff-page-header flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <h1 className="staff-page-title font-heading text-3xl font-bold">
            Orders
          </h1>
          <p className="staff-page-subtitle text-sm text-muted-foreground">
            Collect counter payments, then move paid orders through prep.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={refresh}
          disabled={refreshing}
          className="staff-refresh-button"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh Feed
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="staff-tabs-list flex max-w-full flex-wrap justify-start gap-2 overflow-x-auto rounded-[1.35rem] bg-muted/35 p-1.5 ring-1 ring-border/60">
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
