// Sage PT service worker.
// App shell: network-first (falls back to cache only if offline), so a new
// deploy is picked up on the very next load instead of serving a stale bundle
// indefinitely. CDN modules (esm.sh) rarely change once pinned, so those stay
// cache-first / opportunistically cached for offline use.
// Keep in sync with the ?v= query on app.js in index.html.
const CACHE = "sage-pt-v4";
const SHELL = [
  "./",
  "./index.html",
  "./app.js?v=4",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const isSameOrigin = new URL(req.url).origin === self.location.origin;

  if (isSameOrigin) {
    // App shell: network-first so updates always show up next load.
    event.respondWith(
      fetch(req)
        .then((res) => {
          caches.open(CACHE).then((cache) => cache.put(req, res.clone()));
          return res;
        })
        .catch(() => caches.match(req))
    );
  } else {
    // CDN (esm.sh) modules: stale-while-revalidate so they work offline after first load.
    event.respondWith(
      caches.open(CACHE).then((cache) =>
        cache.match(req).then((cached) => {
          const fetchPromise = fetch(req).then((res) => {
            if (res.ok) cache.put(req, res.clone());
            return res;
          }).catch(() => cached);
          return cached || fetchPromise;
        })
      )
    );
  }
});
