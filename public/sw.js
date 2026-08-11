const CACHE = "snoozelet-mobile-v3";
const SHELL = ["/offline", "/focus-mark.svg", "/study-desk.svg", "/icons/snoozelet-192.png", "/icons/snoozelet-512.png"];
self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL))));
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(Promise.all([
  self.clients.claim(),
  caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("snoozelet-") && key !== CACHE).map((key) => caches.delete(key)))),
])));
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => caches.match("/offline")));
    return;
  }
  // Fingerprinted application scripts and styles remain network-authoritative.
  if (["image", "font"].includes(event.request.destination)) event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => { const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(event.request, copy)); return response; })));
});
