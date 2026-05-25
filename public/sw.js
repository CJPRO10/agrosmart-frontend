const CACHE_NAME = 'agrosmart-v2'
const CACHE_STATIC = 'agrosmart-static-v2'

// Assets estáticos que se cachean al instalar
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// Rutas del dashboard que se cachean para offline
const DASHBOARD_ROUTES = [
  '/inicio', '/cultivos', '/tareas', '/anomalias',
  '/clima', '/recomendaciones', '/finanzas', '/reportes',
  '/mi-finca', '/perfil', '/personal', '/notificaciones',
]

// ── Install: cachea assets esenciales ────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {})
    })
  )
  self.skipWaiting()
})

// ── Activate: limpia caches viejos ───────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== CACHE_STATIC)
          .map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// ── Fetch: estrategia por tipo de recurso ────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignorar extensiones de Chrome y otros
  if (!url.protocol.startsWith('http')) return

  // API calls — Network First, sin cache (datos en tiempo real)
  if (url.pathname.startsWith('/api') || url.hostname.includes('railway')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: 'Sin conexión' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 503,
        })
      )
    )
    return
  }

  // Assets estáticos (_next, iconos, fuentes) — Cache First
  if (
    url.pathname.startsWith('/_next/static') ||
    url.pathname.startsWith('/icons') ||
    url.pathname.includes('.png') ||
    url.pathname.includes('.ico') ||
    url.pathname.includes('.woff')
  ) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached || fetch(request).then((res) => {
          if (res.ok) {
            caches.open(CACHE_STATIC).then((cache) => cache.put(request, res.clone()))
          }
          return res
        })
      )
    )
    return
  }

  // Páginas HTML — Network First con fallback al cache, luego offline
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok) {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, res.clone()))
        }
        return res
      })
      .catch(() =>
        caches.match(request).then((cached) =>
          cached || caches.match('/offline')
        )
      )
  )
})
