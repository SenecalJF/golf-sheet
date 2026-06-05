import "server-only";

import webpush from "web-push";
import type { Notification, NotificationType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

type NotificationInput = {
  recipientId: string;
  type: NotificationType;
  title: string;
  body: string;
  targetUrl: string;
};

type NotificationDispatchPayload = Pick<
  Notification,
  "id" | "recipientId" | "title" | "body" | "targetUrl"
>;

let vapidConfigured = false;

export function getWebPushPublicKey() {
  const publicKey = process.env.WEB_PUSH_VAPID_PUBLIC_KEY?.trim();
  return publicKey && getVapidPrivateKey() && getVapidSubject() ? publicKey : null;
}

export async function createNotifications(
  tx: Prisma.TransactionClient,
  inputs: NotificationInput[],
) {
  const created: Notification[] = [];
  for (const input of inputs) {
    created.push(await tx.notification.create({ data: input }));
  }
  return created;
}

export async function createRoundPublishedNotifications(
  tx: Prisma.TransactionClient,
  {
    actorId,
    actorName,
    round,
    excludeRecipientIds = [],
  }: {
    actorId: string;
    actorName: string;
    round: {
      id: string;
      holeCount: number;
      totalStrokes: number;
      totalPar: number;
      course: { name: string };
    };
    excludeRecipientIds?: string[];
  },
) {
  const skippedIds = new Set([actorId, ...excludeRecipientIds]);
  const recipients = await tx.user.findMany({
    where: { id: { notIn: [...skippedIds] } },
    select: { id: true },
  });

  return createNotifications(
    tx,
    recipients.map((recipient) => ({
      recipientId: recipient.id,
      type: "ROUND_PUBLISHED",
      title: `${actorName} posted ${round.totalStrokes} at ${round.course.name}`,
      body: formatRoundNotificationBody(round),
      targetUrl: `/rounds/${round.id}`,
    })),
  );
}

export async function sendPushNotifications(notifications: NotificationDispatchPayload[]) {
  if (notifications.length === 0 || !configureWebPush()) return;

  const notificationsByUser = new Map<string, NotificationDispatchPayload[]>();
  for (const notification of notifications) {
    notificationsByUser.set(notification.recipientId, [
      ...(notificationsByUser.get(notification.recipientId) ?? []),
      notification,
    ]);
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      enabled: true,
      userId: { in: [...notificationsByUser.keys()] },
    },
  });

  await Promise.all(
    subscriptions.map(async (subscription) => {
      const userNotifications = notificationsByUser.get(subscription.userId);
      if (!userNotifications?.length) return;
      const notification = userNotifications[0];

      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          JSON.stringify({
            title: notification.title,
            body: notification.body,
            url: notification.targetUrl,
            notificationId: notification.id,
            count: userNotifications.length,
          }),
        );
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.deleteMany({ where: { id: subscription.id } });
        }
      }
    }),
  );
}

export function formatRoundNotificationBody({
  holeCount,
  totalStrokes,
  totalPar,
}: {
  holeCount: number;
  totalStrokes: number;
  totalPar: number;
}) {
  const overPar = totalStrokes - totalPar;
  return `${holeCount} holes - ${formatSigned(overPar)} vs par ${totalPar}`;
}

function configureWebPush() {
  if (vapidConfigured) return true;
  const publicKey = process.env.WEB_PUSH_VAPID_PUBLIC_KEY?.trim();
  const privateKey = getVapidPrivateKey();
  const subject = getVapidSubject();
  if (!publicKey || !privateKey || !subject) return false;

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

function getVapidPrivateKey() {
  return process.env.WEB_PUSH_VAPID_PRIVATE_KEY?.trim() || null;
}

function getVapidSubject() {
  return process.env.WEB_PUSH_VAPID_SUBJECT?.trim() || null;
}

function formatSigned(value: number) {
  return `${value >= 0 ? "+" : ""}${value}`;
}
