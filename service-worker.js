const cacheName = "neovid-v0.6";
const appShell = [
  "/",
  "/index.html",
  "/style.css",
  "/script.js",
  "/site.webmanifest",
  "/assets/apple-touch-icon.png",
  "/assets/logo.png",
  "/assets/og-preview.png",
  "/assets/web-app-manifest-192x192.png",
  "/assets/web-app-manifest-512x512.png",
  "/assets/favicon/favicon.svg",
  "/assets/favicon/favicon.ico",
  "/assets/favicon/favicon-96x96.png"
];


self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(cacheName).then(cache => cache.addAll(appShell))
  );
  self.skipWaiting();
});


self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== cacheName)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});


self.addEventListener("fetch", event => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;


  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(cacheName).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }


  event.respondWith(
    caches.match(request).then(cached => {
      return (
        cached ||
        fetch(request).then(response => {
          caches.open(cacheName).then(cache => {
            cache.put(request, response.clone());
          });
          return response;
        })
      );
    })
  );
});



self.addEventListener("message", event => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
