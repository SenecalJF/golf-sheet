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
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          const clientUrl = new URL(client.url);
          const targetUrl = new URL(url, self.location.origin);
          if (clientUrl.origin === targetUrl.origin && "focus" in client) {
            client.navigate(targetUrl.href);
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      }),
  );
});
