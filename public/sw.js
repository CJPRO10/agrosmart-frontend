const CACHE_NAME = 'agrosmart-v3'

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {}))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignorar requests que no son http
  if (!url.protocol.startsWith('http')) return

  // Ignorar API calls y requests externos — dejar pasar sin intervenir
  if (
    url.hostname !== self.location.hostname ||
    url.pathname.startsWith('/api')
  ) return

  // Assets estáticos — Cache First
  if (
    url.pathname.startsWith('/_next/static') ||
    url.pathname.startsWith('/icons') ||
    url.pathname.includes('.png') ||
    url.pathname.includes('.ico') ||
    url.pathname.includes('.woff') ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached || fetch(request).then((res) => {
          if (res.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, res.clone()))
          }
          return res
        })
      )
    )
    return
  }

  // Páginas — Network First, fallback al cache
  if (request.mode === 'navigate') {
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
            cached || caches.match('/')
          )
        )
    )
    return
  }
})