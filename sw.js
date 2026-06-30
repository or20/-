const CACHE_NAME = "erev-10-pwa-v9";

const ASSETS = [
  "./",
  "./index.html",
  "./join.html",
  "./signup.html",
  "./client-v3.html",
  "./manager.html",
  "./courier.html",
  "./bakery.html",
  "./styles.css",
  "./supabase-config.js",
  "./manifest-manager.webmanifest",
  "./manifest-customer.webmanifest",
  "./manifest-courier.webmanifest",
  "./icons/icon-192.svg",
  "./icons/icon-512.svg"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, copy);
        });
        return response;
      })
      .catch(() =>
        caches.match(event.request).then(cached => {
          return cached || caches.match("./index.html");
        })
      )
  );
});