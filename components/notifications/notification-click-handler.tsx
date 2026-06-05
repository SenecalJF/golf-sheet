"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

const NOTIFICATION_CLICK_CACHE = "golf-notification-click-v1";
const NOTIFICATION_CLICK_REQUEST = "/__golf_notification_click__";
const MAX_CLICK_AGE_MS = 5 * 60 * 1000;

type NotificationClickMessage = {
  type?: unknown;
  url?: unknown;
};

type StoredNotificationClick = {
  url?: unknown;
  createdAt?: unknown;
};

export function NotificationClickHandler() {
  const router = useRouter();

  React.useEffect(() => {
    let consuming = false;
    let lastHandledUrl = "";
    let lastHandledAt = 0;

    function routeToTarget(rawUrl: unknown) {
      if (typeof rawUrl !== "string") return;

      let target: URL;
      try {
        target = new URL(rawUrl, window.location.origin);
      } catch {
        return;
      }

      const now = Date.now();
      if (target.origin !== window.location.origin) return;
      if (target.href === lastHandledUrl && now - lastHandledAt < 2000) return;

      const targetPath = `${target.pathname}${target.search}${target.hash}`;
      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      lastHandledUrl = target.href;
      lastHandledAt = now;

      if (targetPath !== currentPath) {
        router.push(targetPath);
      }
    }

    async function consumeStoredTarget() {
      if (consuming || !("caches" in window)) return;

      consuming = true;
      try {
        const cache = await caches.open(NOTIFICATION_CLICK_CACHE);
        const response = await cache.match(NOTIFICATION_CLICK_REQUEST);
        if (!response) return;

        await cache.delete(NOTIFICATION_CLICK_REQUEST);
        const payload = (await response.json().catch(() => null)) as StoredNotificationClick | null;
        if (!payload || typeof payload.createdAt !== "number") return;
        if (Date.now() - payload.createdAt > MAX_CLICK_AGE_MS) return;

        routeToTarget(payload.url);
      } finally {
        consuming = false;
      }
    }

    function handleServiceWorkerMessage(event: MessageEvent) {
      const data = event.data as NotificationClickMessage | null;
      if (!data || data.type !== "GOLF_NOTIFICATION_CLICK") return;

      routeToTarget(data.url);
      void consumeStoredTarget();
    }

    function handleResume() {
      void consumeStoredTarget();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void consumeStoredTarget();
      }
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage);
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleResume);
    window.addEventListener("pageshow", handleResume);
    void consumeStoredTarget();

    return () => {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleResume);
      window.removeEventListener("pageshow", handleResume);
    };
  }, [router]);

  return null;
}
