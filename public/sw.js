self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: "Golf Clubhouse", body: event.data.text() };
    }
  }

  const title = data.title || "Golf Clubhouse";
  const url = data.url || "/";
  const count = typeof data.count === "number" ? data.count : undefined;

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, {
        body: data.body || "You have a new notification.",
        icon: "/tournaments/tits-open/icons/tits-open-192.png",
        badge: "/tournaments/tits-open/icons/tits-open-192.png",
        tag: data.notificationId || url,
        data: { url },
      }),
      count && self.navigator && "setAppBadge" in self.navigator
        ? self.navigator.setAppBadge(count).catch(() => undefined)
        : Promise.resolve(),
    ]),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || "/", self.location.origin);

  event.waitUntil(openNotificationTarget(targetUrl.href));
});

async function openNotificationTarget(url) {
  const targetUrl = new URL(url);
  const clientList = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });

  for (const client of clientList) {
    const clientUrl = new URL(client.url);
    if (clientUrl.origin !== targetUrl.origin || !("navigate" in client)) continue;

    const navigatedClient = await client.navigate(targetUrl.href);
    return (navigatedClient || client).focus();
  }

  return self.clients.openWindow(targetUrl.href);
}
