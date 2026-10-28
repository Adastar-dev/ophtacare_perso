// OphtaCare — service worker
// Stratégie :
//   - App shell (HTML, JS, CSS, icônes) → cache en install, mise à jour en arrière-plan
//   - Appels API /api/* → network-first, fallback sur cache si hors-ligne

const SHELL_CACHE = "ophtacare-shell-v2"
const API_CACHE   = "ophtacare-api-v1"

// Ressources de l'app shell à précacher
const SHELL_URLS = [
  "/",
  "/dashboard/",
  "/manifest.json",
  "/favicon.png",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS))
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== API_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// Background Sync — notifie les clients connectés de synchroniser la file d'attente
self.addEventListener("sync", (event) => {
  if (event.tag === "ophtacare-sync") {
    event.waitUntil(
      self.clients
        .matchAll({ includeUncontrolled: true, type: "window" })
        .then((clients) => {
          for (const client of clients) {
            client.postMessage({ type: "SYNC_REQUESTED" })
          }
        })
    )
  }
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignore les requêtes non-GET et celles vers d'autres origines
  if (request.method !== "GET") return
  if (url.origin !== self.location.origin) return

  if (url.pathname.startsWith("/api/")) {
    // API : network-first, fallback cache
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(API_CACHE).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() => caches.match(request))
    )
  } else {
    // App shell : cache-first, fallback réseau
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(SHELL_CACHE).then((cache) => cache.put(request, clone))
          }
          return response
        })
        return cached ?? network
      })
    )
  }
})
