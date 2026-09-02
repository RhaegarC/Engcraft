/* Pronoun Trainer — service worker. Offline-first after first visit. */
const CACHE = "pronoun-trainer-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./data.js",
  "./manifest.json",
  "./vendor/workbox-window.prod.umd.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(ASSETS))
      // Deliberately no self.skipWaiting() here: workbox-window on the page
      // needs the new version to sit in "waiting" so it can show the update
      // banner. The user confirms, then we skipWaiting via the message below.
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  // Navigation: network-first so updates reach the user; cache fallback offline.
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return res;
        })
        .catch(() =>
          caches.match(e.request).then((r) => r || caches.match("./index.html"))
        )
    );
    return;
  }

  // Static assets: cache-first, fill cache on first fetch.
  e.respondWith(
    caches.match(e.request).then(
      (cached) =>
        cached ||
        fetch(e.request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return res;
        })
    )
  );
});

// The page (workbox-window) asks us to take over after the user taps the
// "new version available" banner's reload button.
self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ---- Web Push ----
// The push service delivers a {title, body, url} payload from the Send
// Function; surface it as a system notification.
self.addEventListener("push", (e) => {
  let payload = { title: "Egnlish Craft", body: "", url: "./" };
  if (e.data) {
    try {
      Object.assign(payload, e.data.json());
    } catch {}
  }
  e.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "./icons/icon-192.png",
      badge: "./icons/icon-192.png",
      data: { url: payload.url },
    })
  );
});

// Tapping the notification closes it and brings the app to the front.
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const target = new URL(
    (e.notification.data && e.notification.data.url) || "./",
    self.registration.scope
  ).href;
  e.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (windows) => {
        for (const w of windows) {
          if ("focus" in w) {
            await w.focus();
            if (w.url !== target && "navigate" in w) await w.navigate(target);
            return;
          }
        }
        return clients.openWindow(target);
      })
      .catch(() => {})
  );
});
