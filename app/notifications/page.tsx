import { Bell } from "lucide-react";
import { requireUser } from "@/lib/auth-utils";
import { getNotificationsForUser } from "@/lib/data";
import { NotificationsList } from "@/components/notifications/notifications-list";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await getNotificationsForUser(user.id);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-primary">Notifications</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">What needs attention</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Round shares and new scores from the clubhouse.
          </p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
          <Bell className="h-5 w-5" />
        </div>
      </div>

      <NotificationsList
        notifications={notifications.map((notification) => ({
          ...notification,
          createdAt: notification.createdAt.toISOString(),
          readAt: notification.readAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
