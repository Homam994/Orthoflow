// EasyOrtho Service Worker
// Build: 202604290717 — update this timestamp on every deploy to force cache refresh
const VERSION  = '202604290717';
const CACHE    = 'easyortho-' + VERSION;
const CORE     = ['./index.html', './admin.html', './manifest.json',
                  './icon-192.png', './icon-512.png', './sw.js'];

// ── Install: cache all core files ─────────────────────────────────────
self.addEventListener('install', e => {
  console.log('[SW] Installing version', VERSION);
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(CORE).catch(err => console.warn('[SW] Cache addAll partial fail:', err)))
      .then(() => self.skipWaiting()) // activate immediately, don't wait for old tab to close
  );
});

// ── Activate: delete ALL old caches ───────────────────────────────────
self.addEventListener('activate', e => {
  console.log('[SW] Activating version', VERSION, '— clearing old caches');
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== CACHE)         // delete everything except current version
          .map(k => {
            console.log('[SW] Deleting old cache:', k);
            return caches.delete(k);
          })
      ))
      .then(() => {
        console.log('[SW] Now controlling all clients');
        return self.clients.claim();          // take control of all open tabs immediately
      })
      .then(() => {
        // Tell all open tabs to reload so they get the fresh version
        self.clients.matchAll({ type: 'window' }).then(clients => {
          clients.forEach(client => client.postMessage({ type: 'SW_UPDATED', version: VERSION }));
        });
      })
  );
});

// ── Fetch: stale-while-revalidate strategy ─────────────────────────────
// Serve from cache instantly, update cache in background
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  
  const url = new URL(e.request.url);
  
  // Skip non-same-origin requests (fonts, etc.) — use network only
  if (url.origin !== self.location.origin) {
    e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })));
    return;
  }
  
  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(e.request).then(cached => {
        // Fetch fresh copy in background
        const fetchPromise = fetch(e.request).then(response => {
          if (response.ok) cache.put(e.request, response.clone());
          return response;
        }).catch(() => null);
        
        // Return cached immediately if available, else wait for network
        return cached || fetchPromise;
      })
    )
  );
});

// ── Message handler: manual update check from app ─────────────────────
self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (e.data?.type === 'GET_VERSION')  e.ports[0]?.postMessage({ version: VERSION });
});
