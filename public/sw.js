// Service Worker para Agrosmart
// Cache First para assets, Network First para API, Offline fallback

const CACHE_NAME = 'agrosmart-v1'
const OFFLINE_PAGE = '/offline'

// Assets estáticos que siempre deben estar disponibles
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
]

// ─── Install: cachea los assets estáticos esenciales ───────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// ─── Activate: limpia caches viejos ────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// ─── Fetch: lógica offline-first ───────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Llamadas al backend (API) → Network First, fallback a IndexedDB en el cliente
  if (url.pathname.startsWith('/api') || url.hostname === 'localhost' && url.port === '8080') {
    return
  }

  // Assets Next.js (_next/static) → Cache First nunca cambian en el mismo build
  if (url.pathname.startsWith('/_next/static')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          return response
        })
      })
    )
    return
  }

  // Páginas de la app → Network First, fallback al cache, luego /offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          return response
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match(OFFLINE_PAGE))
        )
    )
    return
  }

  // Todo lo demás → Network First con fallback a cache
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  )
})

// ─── Background Sync: reintenta solicitudes fallidas cuando hay conexión ─────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-requests') {
    event.waitUntil(syncPendingRequests())
  }
})

async function syncPendingRequests() {
  const clients = await self.clients.matchAll()
  clients.forEach((client) => client.postMessage({ type: 'SYNC_TRIGGERED' }))
}