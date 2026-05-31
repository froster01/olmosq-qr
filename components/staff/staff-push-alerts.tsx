"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  createStaffNotificationSound,
  shouldPlayStaffNotificationSound,
} from "@/lib/notifications/staff-notification-sound";
import type { OrderRealtimeEvent } from "@/lib/realtime/order-events";
import { buildOrderWebSocketUrl } from "@/lib/realtime/order-websocket-client";

type PushSupportState =
  | "checking"
  | "unsupported"
  | "unconfigured"
  | "disabled"
  | "enabled"
  | "denied";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

async function registerStaffServiceWorker() {
  const registration = await navigator.serviceWorker.register("/staff-push-sw.js");
  return navigator.serviceWorker.ready.then(() => registration);
}

async function syncExistingPushSubscription(subscription: PushSubscription) {
  const response = await fetch("/staff/push-subscriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription),
  });

  return response.ok;
}

export function StaffPushAlerts() {
  const [state, setState] = useState<PushSupportState>("checking");
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [subscriptionEndpoint, setSubscriptionEndpoint] = useState<string | null>(
    null
  );
  const [soundUnlocked, setSoundUnlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const soundRef = useRef<ReturnType<typeof createStaffNotificationSound> | null>(
    null
  );

  useEffect(() => {
    soundRef.current = createStaffNotificationSound({
      src: "/sounds/new-order.mp3",
    });
  }, []);

  const unlockAlertSound = useCallback(async () => {
    const unlocked = (await soundRef.current?.unlock()) ?? false;
    setSoundUnlocked(unlocked);
    return unlocked;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function checkSupport() {
      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        setState("unsupported");
        return;
      }

      const response = await fetch("/staff/push-subscriptions", {
        cache: "no-store",
      });
      const config = await response.json();

      if (cancelled) return;

      if (!config.enabled || !config.publicKey) {
        setPublicKey(config.publicKey ?? null);
        setSubscriptionEndpoint(null);
        setSoundUnlocked(false);
        setState("unconfigured");
        return;
      }

      setPublicKey(config.publicKey);

      if (Notification.permission === "denied") {
        setSubscriptionEndpoint(null);
        setSoundUnlocked(false);
        setState("denied");
        return;
      }

      const registration = await registerStaffServiceWorker();
      const subscription = await registration.pushManager.getSubscription();

      if (!cancelled) {
        if (!subscription) {
          setSubscriptionEndpoint(null);
          setSoundUnlocked(false);
          setState("disabled");
          return;
        }

        const synced = await syncExistingPushSubscription(subscription);
        setSubscriptionEndpoint(synced ? subscription.endpoint : null);
        setSoundUnlocked(false);
        setState(synced ? "enabled" : "disabled");
      }
    }

    checkSupport().catch(() => {
      if (!cancelled) setState("unsupported");
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function enableAlerts() {
    if (!publicKey) return;
    setBusy(true);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "disabled");
        return;
      }

      const registration = await registerStaffServiceWorker();
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      if (!(await syncExistingPushSubscription(subscription))) {
        throw new Error("Failed to save push subscription");
      }

      await unlockAlertSound();
      setSubscriptionEndpoint(subscription.endpoint);
      setState("enabled");
      toast.success("Push alerts enabled");
    } catch {
      toast.error("Could not enable push alerts");
    } finally {
      setBusy(false);
    }
  }

  async function disableAlerts() {
    setBusy(true);

    try {
      const registration = await registerStaffServiceWorker();
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await fetch("/staff/push-subscriptions", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }

      setSubscriptionEndpoint(null);
      setSoundUnlocked(false);
      setState("disabled");
      toast.success("Push alerts disabled");
    } catch {
      toast.error("Could not disable push alerts");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (state !== "enabled" || soundUnlocked) {
      return;
    }

    const handleUserGesture = () => {
      void unlockAlertSound();
    };

    window.addEventListener("pointerdown", handleUserGesture, { once: true });
    window.addEventListener("keydown", handleUserGesture, { once: true });

    return () => {
      window.removeEventListener("pointerdown", handleUserGesture);
      window.removeEventListener("keydown", handleUserGesture);
    };
  }, [state, soundUnlocked, unlockAlertSound]);

  useEffect(() => {
    if (state !== "enabled" || !subscriptionEndpoint || !soundUnlocked) {
      return;
    }

    let cancelled = false;

    async function sendPresence() {
      if (cancelled || document.visibilityState !== "visible") {
        return;
      }

      try {
        await fetch("/staff/alert-presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscriptionEndpoint }),
        });
      } catch {
        // Presence is a best-effort signal; failed heartbeats should not affect alerts.
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void sendPresence();
      }
    };

    void sendPresence();
    const interval = window.setInterval(sendPresence, 10_000);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [state, subscriptionEndpoint, soundUnlocked]);

  useEffect(() => {
    if (state !== "enabled") {
      return;
    }

    let cancelled = false;
    let socket: WebSocket | null = null;
    let reconnectTimer: number | null = null;

    function connect() {
      if (cancelled) {
        return;
      }

      socket = new WebSocket(buildOrderWebSocketUrl({ scope: "staff" }));

      socket.onmessage = (message) => {
        try {
          const event = JSON.parse(message.data) as OrderRealtimeEvent;
          if (
            shouldPlayStaffNotificationSound({
              kind: event.kind,
              isDocumentVisible: document.visibilityState === "visible",
            })
          ) {
            void soundRef.current?.play();
          }
        } catch {
          // Ignore malformed realtime messages; the orders page refresh path remains separate.
        }
      };

      socket.onerror = () => {
        socket?.close();
      };

      socket.onclose = () => {
        if (!cancelled) {
          reconnectTimer = window.setTimeout(connect, 3000);
        }
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
      }
      socket?.close();
    };
  }, [state]);

  if (state === "checking" || state === "unsupported") {
    return null;
  }

  if (state === "unconfigured") {
    return (
      <Button variant="outline" size="sm" disabled className="staff-push-button">
        <BellOff className="h-4 w-4" />
        Alert off
      </Button>
    );
  }

  if (state === "denied") {
    return (
      <Button variant="outline" size="sm" disabled className="staff-push-button">
        <BellOff className="h-4 w-4" />
        Alerts blocked
      </Button>
    );
  }

  return (
    <Button
      variant={state === "enabled" ? "default" : "outline"}
      size="sm"
      disabled={busy}
      onClick={state === "enabled" ? disableAlerts : enableAlerts}
      className="staff-push-button"
    >
      {state === "enabled" ? (
        <Bell className="h-4 w-4" />
      ) : (
        <BellOff className="h-4 w-4" />
      )}
      {state === "enabled" ? "Alert on" : "Alert off"}
    </Button>
  );
}
