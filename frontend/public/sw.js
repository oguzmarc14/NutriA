// Service worker de NutriA. prepare-pwa.mjs asigna una version distinta por deploy.
// No guardar respuestas de API, datos personales o documentos clinicos en Cache Storage.
const CACHE_NAME = 'nutria-shell-local'
const ASSETS_NAME = 'nutria-assets-local'
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg',
  '/icon-192.png', '/icon-512.png', '/imagenes/logo-nutria.png']

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME)
    await Promise.allSettled(APP_SHELL.map((url) => cache.add(new Request(url, { cache: 'reload' }))))
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter((name) =>
      (name.startsWith('nutria-shell-') || name.startsWith('nutria-assets-')) &&
      name !== CACHE_NAME && name !== ASSETS_NAME
    ).map((name) => caches.delete(name)))
    await self.clients.claim()
    const pages = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    pages.forEach((page) => page.postMessage({ type: 'NUTRIA_PWA_ACTUALIZADA' }))
  })())
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/') ||
      url.pathname === '/sw.js' || url.pathname === '/version.json') return

  if (request.mode === 'navigate') {
    // Primero internet. Nunca mantener HTML antiguo si existe una version nueva.
    event.respondWith((async () => {
      try {
        const response = await fetch(request, { cache: 'no-store' })
        if (response.ok && response.type === 'basic') {
          const cache = await caches.open(CACHE_NAME)
          await cache.put('/index.html', response.clone())
        }
        return response
      } catch (error) {
        return (await caches.match('/index.html')) ||
          Response.error()
      }
    })())
    return
  }

  if (url.pathname.startsWith('/assets/')) {
    // JS/CSS nuevos primero desde la red. Respaldo offline por nombre con hash.
    event.respondWith((async () => {
      try {
        const response = await fetch(request)
        if (response.ok && response.type === 'basic') {
          const cache = await caches.open(ASSETS_NAME)
          await cache.put(request, response.clone())
        }
        return response
      } catch (error) {
        return (await caches.match(request)) || Response.error()
      }
    })())
    return
  }
  // El resto (incluidas imagenes dinamicas y archivos clinicos) usa el navegador.
})
