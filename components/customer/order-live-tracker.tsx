"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, RefreshCw } from "lucide-react";

import {
  getCustomerTrackingState,
} from "@/lib/orders/customer-tracking";
import { StatusBadge } from "@/components/staff/status-badge";
import { cn } from "@/lib/utils";
import { buildOrderWebSocketUrl } from "@/lib/realtime/order-websocket-client";
import type { OrderRealtimeEvent } from "@/lib/realtime/order-events";

type OrderStatusResponse = {
  status: string;
  updatedAt: string;
  tracking: ReturnType<typeof getCustomerTrackingState>;
};

export function OrderLiveTracker({
  orderId,
  initialStatus,
  initialUpdatedAt,
}: {
  orderId: string;
  initialStatus: string;
  initialUpdatedAt: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt);
  const [lastCheckedAt, setLastCheckedAt] = useState(initialUpdatedAt);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasConnectionError, setHasConnectionError] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  const tracking = useMemo(() => getCustomerTrackingState(status), [status]);

  const refreshStatus = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Could not refresh order status");
      }

      const data = (await response.json()) as OrderStatusResponse;

      setStatus(data.status);
      setUpdatedAt(data.updatedAt);
      setLastCheckedAt(new Date().toISOString());
      setHasConnectionError(false);
    } catch {
      setHasConnectionError(true);
    } finally {
      setIsRefreshing(false);
    }
  }, [orderId]);

  useEffect(() => {
    let isMounted = true;
    let socket: WebSocket | null = null;

    const connectTimer = window.setTimeout(() => {
      if (!isMounted) {
        return;
      }

      socket = new WebSocket(
        buildOrderWebSocketUrl({ scope: "customer", orderId })
      );

      socket.onopen = () => {
        if (!isMounted) {
          return;
        }

        setIsSocketConnected(true);
        void refreshStatus();
      };

      socket.onmessage = (message) => {
        try {
          const event = JSON.parse(message.data) as {
            kind?: string;
            customerStatus?: OrderRealtimeEvent["customerStatus"];
          };

          if (!isMounted || event.kind === "connected" || !event.customerStatus) {
            return;
          }

          setStatus(event.customerStatus.status);
          setUpdatedAt(event.customerStatus.updatedAt);
          setLastCheckedAt(new Date().toISOString());
          setHasConnectionError(false);
        } catch {
          setHasConnectionError(true);
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
  }, [orderId, refreshStatus]);

  useEffect(() => {
    if (tracking.isFinal || isSocketConnected) {
      return;
    }

    const intervalId = window.setInterval(refreshStatus, 5000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [isSocketConnected, refreshStatus, tracking.isFinal]);

  return (
    <section className="customer-confirmation-section">
      <div className="customer-confirmation-status-row">
        <div>
          <span className="customer-confirmation-label">Live status</span>
          <StatusBadge status={status} />
        </div>
        <div
          className={cn(
            "customer-confirmation-live-chip",
            tracking.isFinal && "customer-confirmation-live-chip-final",
            hasConnectionError && "customer-confirmation-live-chip-warning"
          )}
        >
          {tracking.isFinal ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <RefreshCw
              className={cn("h-4 w-4", isRefreshing && "animate-spin")}
            />
          )}
          {hasConnectionError ? "Reconnecting" : tracking.signal}
        </div>
      </div>

      <div className="customer-confirmation-live-copy">
        <h2>{tracking.headline}</h2>
        <p>{tracking.detail}</p>
      </div>

      <div className="customer-confirmation-steps" aria-label="Order progress">
        {tracking.steps.map((step) => (
          <div
            key={step.key}
            className="customer-confirmation-step"
            data-state={step.state}
          >
            <span />
            <p>{step.label}</p>
          </div>
        ))}
      </div>

      <p className="customer-confirmation-live-meta">
        <Clock3 className="h-3.5 w-3.5" />
        Updated {formatLiveTime(updatedAt)}. Checked {formatLiveTime(lastCheckedAt)}.
      </p>
    </section>
  );
}

function formatLiveTime(value: string) {
  return new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
