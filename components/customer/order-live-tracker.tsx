"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, RefreshCw } from "lucide-react";

import {
  getCustomerTrackingState,
} from "@/lib/orders/customer-tracking";
import { StatusBadge } from "@/components/customer/status-badge";
import { cn } from "@/lib/utils";
import { subscribeToOrderUpdates } from "@/lib/api/sse-client";
import { customerApi } from "@/lib/api/client";

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
  const [isConnected, setIsConnected] = useState(false);

  const tracking = useMemo(() => getCustomerTrackingState(status), [status]);

  const refreshStatus = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await customerApi.getOrderStatus(orderId);
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

    // Connect to SSE
    const unsubscribe = subscribeToOrderUpdates(orderId, (data) => {
      if (!isMounted) return;

      if (data.type === 'connected') {
        setIsConnected(true);
        setHasConnectionError(false);
      } else if (data.type === 'initial' || data.type === 'order-update') {
        if (data.order) {
          setStatus(data.order.status);
          setUpdatedAt(data.order.updatedAt);
          setHasConnectionError(false);
        }
      }
    });

    // Fallback polling every 10 seconds if SSE fails
    const pollInterval = setInterval(() => {
      if (!isConnected) {
        void refreshStatus();
      }
    }, 10000);

    return () => {
      isMounted = false;
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, [orderId, refreshStatus, isConnected]);

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
