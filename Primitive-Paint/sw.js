// --- CONFIGURACIÓN DE CACHÉ ---
// ⚠️ CAMBIA ESTO PARA FORZAR LA ACTUALIZACIÓN DE TUS ARCHIVOS ESTÁTICOS Y DE CÓDIGO
const CACHE_VERSION = 'v4'; 
const CACHE_NAME = `miweb-assets-${CACHE_VERSION}`; 
const API_CACHE = `miweb-api-${CACHE_VERSION}`; 

// Archivos estáticos mínimos para el modo offline
// Evita duplicados y asegúrate de incluir todos los recursos esenciales

// Error de referencia "sw.js:1  Uncaught (in promise) InvalidStateError: Failed to execute 'addAll' on 'Cache': Cache.addAll(): duplicate requests"

const STATIC_ASSETS = [
  'index.html',
  "assets/css/paper.css",
  "assets/images/color-circle.png",
  "circle.html",
  "CONTRIBUTING.md",
  "ellipse.html",
  "install.html",
  "LICENSE",
  "list.js",
  "manifest.json",
  "Primitive-Paint Snapshots/circle-pad.png",
  "Primitive-Paint Snapshots/ellipse-pad.png",
  "Primitive-Paint Snapshots/home-page.png",
  "Primitive-Paint Snapshots/reactangle-pad.png",
  "Primitive-Paint Snapshots/simple-pad.png",
  "README.md",
  "rectangle.html",
  "simplePen.html",
  "_config.yml",
];

// --- INSTALL ---
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
  );
});

// --- ACTIVATE y LIMPIEZA ---
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        // Borra cachés que no coincidan con la versión actual
        keys
          .filter(key => key !== CACHE_NAME && key !== API_CACHE)
          .map(key => caches.delete(key))
      );
    })
  );
});

// --- FETCH (RED PRIMERO, CACHÉ SÓLO EN FALLO) ---
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Excluir métodos que no sean GET y peticiones de otros dominios
  if (request.method !== 'GET' || url.origin !== location.origin) {
    return;
  }
  
  // Determinar qué caché usar
  const targetCache = url.pathname.includes('/api/') ? API_CACHE : CACHE_NAME;

  event.respondWith(
    (async () => {
      try {
        // 1. INTENTO DE RED (Prioridad)
        const networkResponse = await fetch(request);

        // Si es válido, lo guardamos en caché en segundo plano
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          const cache = await caches.open(targetCache);
          cache.put(request, responseClone);
        }

        // Devolvemos la respuesta fresca de la red
        return networkResponse;

      } catch (error) {
        // 2. MODO OFFLINE: Buscar en caché
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
          return cachedResponse;
        }

        // 3. FALLBACK DE NAVEGACIÓN (Si la página específica no está en caché)
        if (request.mode === 'navigate') {
          return await caches.match('index.html'); 
        }

        // Devolver un error 404 si no se encontró nada
        return new Response('Recurso no disponible offline', { status: 404 });
      }
    })()
  );
});