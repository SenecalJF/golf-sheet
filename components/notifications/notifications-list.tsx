"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck, CircleDot, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  type: "ROUND_ASSIGNED" | "ROUND_PUBLISHED";
  title: string;
  body: string;
  targetUrl: string;
  readAt: string | null;
  createdAt: string;
};

export function NotificationsList({
  notifications,
}: {
  notifications: NotificationItem[];
}) {
  const router = useRouter();
  const [items, setItems] = React.useState(notifications);
  const [busy, setBusy] = React.useState<string | null>(null);
  const unreadCount = items.filter((item) => !item.readAt).length;

  async function markRead(id: string) {
    setItems((current) =>
      current.map((item) =>
        item.id === id && !item.readAt ? { ...item, readAt: new Date().toISOString() } : item,
      ),
    );
    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
      router.refresh();
    } catch {
      router.refresh();
    }
  }

  async function markAllRead() {
    setBusy("all");
    const now = new Date().toISOString();
    try {
      const res = await fetch("/api/notifications/read-all", { method: "POST" });
      if (!res.ok) throw new Error("Failed to mark notifications read");
      setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? now })));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to mark notifications read");
    } finally {
      setBusy(null);
    }
  }

  if (items.length === 0) {
    return (
      <Card className="grid min-h-72 place-items-center p-8 text-center">
        <div>
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-primary">
            <Bell className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-xl font-semibold tracking-tight">No notifications yet</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            New shared scorecard rows and clubhouse rounds will appear here.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Recent notifications</h2>
          <p className="text-xs text-muted-foreground">
            {unreadCount} unread of {items.length}
          </p>
        </div>
        <Button
          variant="outline"
          className="h-10"
          onClick={markAllRead}
          disabled={busy === "all" || unreadCount === 0}
        >
          <CheckCheck className="mr-1 h-4 w-4" />
          {busy === "all" ? "Marking..." : "Mark all read"}
        </Button>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "rounded-lg border border-border/60 bg-card/70 transition-colors",
              !item.readAt && "border-primary/35 bg-primary/5",
            )}
          >
            <Link
              href={item.targetUrl}
              onClick={() => markRead(item.id)}
              className="flex min-h-24 items-start gap-3 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <div
                className={cn(
                  "mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                  item.readAt ? "bg-secondary text-muted-foreground" : "bg-primary/15 text-primary",
                )}
              >
                {item.readAt ? (
                  <Bell className="h-4 w-4" />
                ) : (
                  <CircleDot className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold tracking-tight">{item.title}</h3>
                  {!item.readAt && (
                    <Badge variant="outline" className="border-primary/40 text-primary">
                      New
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                  <span>-</span>
                  <span>{item.type === "ROUND_ASSIGNED" ? "Shared round" : "New round"}</span>
                </div>
              </div>
              <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          </div>
        ))}
      </div>
    </Card>
  );
}
