// AgroSmart Service Worker — Offline First
const CACHE_SHELL = 'agrosmart-shell-v4'
const CACHE_DATA  = 'agrosmart-data-v4'

// ── Install: cachea el shell completo de la app ───────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_SHELL).then((cache) =>
      cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        '/icons/icon-192x192.png',
        '/icons/icon-512x512.png',
      ]).catch(() => {})
    )
  )
  self.skipWaiting()
})

// ── Activate: limpia caches viejos ───────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_SHELL && k !== CACHE_DATA)
          .map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Solo manejar requests del mismo origen
  if (url.origin !== self.location.origin) return
  if (!url.protocol.startsWith('http')) return

  // Assets de Next.js (_next/static) — Cache First permanente
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached || fetch(request).then((res) => {
          caches.open(CACHE_SHELL).then((c) => c.put(request, res.clone()))
          return res
        })
      )
    )
    return
  }

  // Chunks de Next.js (_next/chunk, etc) — Cache First
  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached || fetch(request).then((res) => {
          if (res.ok) {
            caches.open(CACHE_SHELL).then((c) => c.put(request, res.clone()))
          }
          return res
        }).catch(() => cached || new Response('', { status: 503 }))
      )
    )
    return
  }

  // Iconos y assets estáticos — Cache First
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.json' ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached || fetch(request).then((res) => {
          if (res.ok) {
            caches.open(CACHE_SHELL).then((c) => c.put(request, res.clone()))
          }
          return res
        })
      )
    )
    return
  }

  // Páginas HTML de la SPA — App Shell: siempre servir el index.html cacheado
  // Next.js SPA maneja el routing en el cliente
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            caches.open(CACHE_SHELL).then((c) => c.put(request, res.clone()))
          }
          return res
        })
        .catch(() =>
          // Sin internet: servir el index cacheado (SPA routing funciona offline)
          caches.match(request)
            .then((cached) => cached || caches.match('/'))
        )
    )
    return
  }
})

// ── Mensaje desde el cliente ──────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting()
})
