"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { OrdersList } from "@/components/staff/orders-list";
import { buildOrderWebSocketUrl } from "@/lib/realtime/order-websocket-client";
import type { OrderRealtimeEvent } from "@/lib/realtime/order-events";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getStaffNotificationSound,
  readStaffNotificationSoundEnabled,
  shouldPlayStaffNotificationSound,
  STAFF_NOTIFICATION_SOUND_CHANGE_EVENT,
  STAFF_NOTIFICATION_SOUND_STORAGE_KEY,
} from "@/lib/notifications/staff-notification-sound";

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
  const soundEnabledRef = useRef(false);

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
    soundEnabledRef.current = readStaffNotificationSoundEnabled(
      window.localStorage
    );

    function handleSoundChange(event: Event) {
      const enabled = (event as CustomEvent<{ enabled?: boolean }>).detail
        ?.enabled;
      soundEnabledRef.current =
        typeof enabled === "boolean"
          ? enabled
          : readStaffNotificationSoundEnabled(window.localStorage);
    }

    function handleStorageChange(event: StorageEvent) {
      if (event.key === STAFF_NOTIFICATION_SOUND_STORAGE_KEY) {
        soundEnabledRef.current = readStaffNotificationSoundEnabled(
          window.localStorage
        );
      }
    }

    window.addEventListener(
      STAFF_NOTIFICATION_SOUND_CHANGE_EVENT,
      handleSoundChange
    );
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(
        STAFF_NOTIFICATION_SOUND_CHANGE_EVENT,
        handleSoundChange
      );
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (!currentShift) {
      return;
    }

    function sendPresenceHeartbeat() {
      void fetch("/staff/presence", {
        method: "POST",
        cache: "no-store",
      });
    }

    sendPresenceHeartbeat();
    const presenceTimer = window.setInterval(sendPresenceHeartbeat, 10000);

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

        void refresh();
      };

      socket.onmessage = (message) => {
        try {
          const event = JSON.parse(message.data) as OrderRealtimeEvent;
          if (!event.staffOrder) {
            return;
          }

          if (
            shouldPlayStaffNotificationSound({
              enabled: soundEnabledRef.current,
              eventKind: event.kind,
              hasOpenShift: Boolean(currentShift),
            })
          ) {
            void getStaffNotificationSound().play();
          }

          const staffOrder = event.staffOrder;
          setOrders((current) => sortOrders(upsertOrder(current, staffOrder)));
        } catch {
          void refresh();
        }
      };

      socket.onerror = () => {
        socket?.close();
      };

      socket.onclose = () => {
        if (isMounted) {
          void refresh();
        }
      };
    }, 0);

    return () => {
      isMounted = false;
      window.clearInterval(presenceTimer);
      window.clearTimeout(connectTimer);
      socket?.close();
    };
  }, [currentShift, refresh]);

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

      <div className="relative min-h-[24rem]">
        <div
          aria-hidden={!currentShift}
          className={cn(
            "transition duration-200",
            !currentShift &&
              "pointer-events-none select-none opacity-45 blur-[2px]"
          )}
        >
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

        {!currentShift && (
          <div className="absolute inset-0 z-10 flex items-start justify-center px-3 pt-10 sm:items-center sm:pt-0">
            <Card className="w-full max-w-md border-primary/20 bg-card/95 text-center shadow-[0_18px_60px_rgba(51,51,51,0.16)] backdrop-blur">
              <CardContent className="space-y-4 p-6">
                <div className="mx-auto grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Lock className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <h2 className="font-heading text-2xl font-bold">
                    Open a shift before taking orders
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Start the shift from the Shift page so new table orders can
                    be assigned to the correct counter session.
                  </p>
                </div>
                <Link
                  className={cn(buttonVariants({ size: "lg" }), "w-full")}
                  href="/staff/shift"
                >
                  Open Shift Page
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
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
