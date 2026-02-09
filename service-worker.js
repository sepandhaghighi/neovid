const cacheName = "neovid-v0.5";
const appShell = [
  "/",
  "/index.html",
  "/style.css",
  "/script.js",
  "/site.webmanifest",
  "assets/apple-touch-icon.png",
  "assets/logo.png",
  "assets/og-preview.png",
  "assets/web-app-manifest-192x192.png",
  "assets/web-app-manifest-512x512.png",
  "assets/favicon/favicon.svg",
  "assets/favicon/favicon.ico",
  "assets/favicon/favicon-96x96.png"
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
  event.respondWith(
    caches.match(event.request).then(res => res || fetch(event.request))
  );
});


self.addEventListener("message", event => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
