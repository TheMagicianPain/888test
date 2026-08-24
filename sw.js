// Minimal service worker for The Magician's Path — The Draw
// Handles: (1) installability (home screen), (2) receiving + displaying push notifications.

const CACHE_NAME = "magi-shell-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Pass-through fetch handler — required by browsers for a page to be
// considered "installable." We're not doing offline caching of the app
// itself here, just satisfying the installability requirement.
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});

// Fires when a push notification arrives from the server (once the Worker
// side is wired up to send them via the stored subscription + VAPID keys).
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "The Magician's Path", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "The Magician's Path";
  const options = {
    body: data.body || "Your practice is waiting for you.",
    icon: "icon-192.png",
    badge: "icon-192.png",
    data: { url: data.url || "./index.html" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Fires when the user taps the notification — focuses an existing tab
// if one's open, otherwise opens a new one to the given URL.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "./index.html";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
