/* ======================================================================
   SERVICE WORKER — Cadastro de Funcionários SEMED Juruá
   Faz cache apenas da "casca" do aplicativo (HTML/ícones/manifest),
   para permitir instalação e abertura rápida/offline da interface.
   Os dados (Firebase) e documentos (Cloudinary) sempre vêm da rede,
   nunca são interceptados aqui — login e cadastro exigem internet.
   ====================================================================== */

const CACHE_NAME = 'semed-funcionarios-v1';

const APP_SHELL = [
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192-maskable.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(nomes =>
      Promise.all(nomes.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Só cuida de requisições GET, e só do mesmo domínio (a casca do app).
  // Firebase (Auth/Realtime Database), Cloudinary e CDNs (gstatic/cdnjs)
  // são de outros domínios e passam direto pela rede, sem interferência.
  if (req.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      const fetchPromise = fetch(req)
        .then(resp => {
          if (resp && resp.status === 200) {
            const copia = resp.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, copia));
          }
          return resp;
        })
        .catch(() => cached || caches.match('./index.html'));
      return cached || fetchPromise;
    })
  );
});
