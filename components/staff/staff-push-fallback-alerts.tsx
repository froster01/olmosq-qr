"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

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

export function StaffPushFallbackAlerts() {
  const [state, setState] = useState<PushSupportState>("checking");
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
        setState("unconfigured");
        return;
      }

      setPublicKey(config.publicKey);

      if (Notification.permission === "denied") {
        setState("denied");
        return;
      }

      const registration = await registerStaffServiceWorker();
      const subscription = await registration.pushManager.getSubscription();

      if (!cancelled) {
        setState(subscription ? "enabled" : "disabled");
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

      const response = await fetch("/staff/push-subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        throw new Error("Failed to save push subscription");
      }

      setState("enabled");
      toast.success("Sleep alerts enabled");
    } catch {
      toast.error("Could not enable sleep alerts");
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

      setState("disabled");
      toast.success("Sleep alerts disabled");
    } catch {
      toast.error("Could not disable sleep alerts");
    } finally {
      setBusy(false);
    }
  }

  if (state === "checking" || state === "unsupported") {
    return null;
  }

  if (state === "unconfigured") {
    return (
      <Button variant="outline" size="sm" disabled className="staff-push-button">
        <BellOff className="h-4 w-4" />
        Sleep alerts off
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
      {state === "enabled" ? "Sleep alerts on" : "Sleep alerts"}
    </Button>
  );
}
