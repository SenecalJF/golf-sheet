"use client";

import * as React from "react";
import { Bell, BellOff, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type PushState =
  | { status: "checking"; label: string; detail: string }
  | { status: "unsupported"; label: string; detail: string }
  | { status: "not-configured"; label: string; detail: string }
  | { status: "blocked"; label: string; detail: string }
  | { status: "ready"; label: string; detail: string }
  | { status: "enabled"; label: string; detail: string };

type PublicKeyResponse = {
  enabled: boolean;
  publicKey: string | null;
};

export function PushNotificationSettings() {
  const [state, setState] = React.useState<PushState>({
    status: "checking",
    label: "Checking",
    detail: "Checking this browser.",
  });
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    async function checkSupport() {
      await Promise.resolve();
      if (cancelled) return;

      if (!supportsPush()) {
        setState({
          status: "unsupported",
          label: "Unsupported",
          detail: unsupportedMessage(),
        });
        return;
      }

      const keyStatus = await getPublicKey();
      if (cancelled) return;
      if (!keyStatus.enabled || !keyStatus.publicKey) {
        setState({
          status: "not-configured",
          label: "Not configured",
          detail: "Web Push keys are not configured on this deployment.",
        });
        return;
      }

      if (Notification.permission === "denied") {
        setState({
          status: "blocked",
          label: "Blocked",
          detail: "Notifications are blocked in this browser.",
        });
        return;
      }

      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();
      if (cancelled) return;

      setState(
        subscription && Notification.permission === "granted"
          ? {
              status: "enabled",
              label: "Enabled",
              detail: "This browser can receive round notifications.",
            }
          : {
              status: "ready",
              label: "Available",
              detail: "Enable alerts for shared rows and new rounds.",
            },
      );
    }

    checkSupport();
    return () => {
      cancelled = true;
    };
  }, []);

  async function enablePush() {
    setBusy(true);
    try {
      if (!supportsPush()) throw new Error(unsupportedMessage());
      const keyStatus = await getPublicKey();
      if (!keyStatus.enabled || !keyStatus.publicKey) {
        throw new Error("Web Push keys are not configured on this deployment.");
      }

      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState({
          status: permission === "denied" ? "blocked" : "ready",
          label: permission === "denied" ? "Blocked" : "Available",
          detail:
            permission === "denied"
              ? "Notifications are blocked in this browser."
              : "Notifications were not enabled.",
        });
        return;
      }

      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(keyStatus.publicKey),
        }));

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!res.ok) throw new Error("Could not save this browser subscription.");

      setState({
        status: "enabled",
        label: "Enabled",
        detail: "This browser can receive round notifications.",
      });
      toast.success("Notifications enabled");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Notifications failed");
    } finally {
      setBusy(false);
    }
  }

  async function disablePush() {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();
      const endpoint = subscription?.endpoint;
      if (subscription) await subscription.unsubscribe();

      const res = await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(endpoint ? { endpoint } : {}),
      });
      if (!res.ok) throw new Error("Could not disable notifications.");

      setState({
        status: "ready",
        label: "Available",
        detail: "Enable alerts for shared rows and new rounds.",
      });
      toast.success("Notifications disabled");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Disable failed");
    } finally {
      setBusy(false);
    }
  }

  const enabled = state.status === "enabled";
  const unavailable =
    state.status === "checking" ||
    state.status === "unsupported" ||
    state.status === "not-configured" ||
    state.status === "blocked";

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
          <Smartphone className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold tracking-tight">Phone notifications</h2>
          <p className="text-xs text-muted-foreground">{state.detail}</p>
        </div>
        <div className="ml-auto">
          <Badge
            variant="outline"
            className={
              enabled
                ? "border-primary/40 text-primary"
                : state.status === "blocked" || state.status === "not-configured"
                  ? "border-amber-500/40 text-amber-400"
                  : ""
            }
          >
            {state.label}
          </Badge>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {enabled ? (
          <Button variant="outline" onClick={disablePush} disabled={busy}>
            <BellOff className="mr-1 h-4 w-4" />
            {busy ? "Disabling..." : "Disable notifications"}
          </Button>
        ) : (
          <Button onClick={enablePush} disabled={busy || unavailable}>
            <Bell className="mr-1 h-4 w-4" />
            {busy ? "Enabling..." : "Enable notifications"}
          </Button>
        )}
      </div>
    </Card>
  );
}

async function getPublicKey(): Promise<PublicKeyResponse> {
  const res = await fetch("/api/push/public-key");
  if (!res.ok) return { enabled: false, publicKey: null };
  return res.json();
}

function supportsPush() {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return false;
  }
  return !isIosBrowserOutsideStandalone();
}

function unsupportedMessage() {
  if (typeof window !== "undefined" && isIosBrowserOutsideStandalone()) {
    return "On iPhone, open the Home Screen app to enable notifications.";
  }
  return "This browser does not support Web Push notifications.";
}

function isIosBrowserOutsideStandalone() {
  const nav = navigator as Navigator & { standalone?: boolean };
  const isIos =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone =
    nav.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
  return isIos && !standalone;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
