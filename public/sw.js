// sw.js — Service Worker del Cotizador de Aluminio y Vidrio
// Versión del caché: incrementar al hacer deploy para forzar actualización
const CACHE_NAME = "cotizador-v1";

// Recursos esenciales que se cachean al instalar el SW (App Shell)
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.json",
];

// ── Evento install: pre-caché del App Shell ───────────────────────
self.addEventListener("install", (event) => {
  console.log("[SW] Instalando Service Worker…");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Pre-cacheando App Shell");
      return cache.addAll(APP_SHELL);
    })
  );
  // Activa el nuevo SW de inmediato sin esperar que cierren las pestañas
  self.skipWaiting();
});

// ── Evento activate: limpia cachés viejos ────────────────────────
self.addEventListener("activate", (event) => {
  console.log("[SW] Activando Service Worker…");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log("[SW] Eliminando caché antiguo:", key);
            return caches.delete(key);
          })
      )
    )
  );
  // Toma control de todas las pestañas abiertas inmediatamente
  self.clients.claim();
});

// ── Evento fetch: estrategia Network-first con fallback a caché ──
self.addEventListener("fetch", (event) => {
  // Solo intercepta peticiones GET
  if (event.request.method !== "GET") return;

  // No intercepta peticiones a Supabase (siempre deben ir a la red)
  const url = new URL(event.request.url);
  if (url.hostname.includes("supabase")) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Si la red responde OK, actualiza el caché y devuelve la respuesta
        if (networkResponse && networkResponse.status === 200) {
          const cloned = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) =>
            cache.put(event.request, cloned)
          );
        }
        return networkResponse;
      })
      .catch(() => {
        // Sin red → sirve desde caché (modo offline)
        return caches.match(event.request).then(
          (cached) => cached || new Response("Sin conexión", { status: 503 })
        );
      })
  );
});
