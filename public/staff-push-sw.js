self.addEventListener("push", (event) => {
  let payload = {
    title: "New order",
    body: "A customer placed a new order.",
    url: "/staff/orders",
    tag: "staff-order-alert",
  };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      tag: payload.tag,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      data: { url: payload.url || "/staff/orders" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/staff/orders";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        const clientUrl = new URL(client.url);
        if (clientUrl.pathname.startsWith("/staff")) {
          client.navigate(url);
          return client.focus();
        }
      }

      return self.clients.openWindow(url);
    })
  );
});
