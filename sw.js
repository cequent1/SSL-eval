// Service Worker pour l'application SSL Evaluation
const CACHE_NAME = 'ssl-eval-v10'; // ⬅️ Incrémente ce numéro à chaque mise à jour !
const urlsToCache = [
  './',
  './index.html'
];

// Installation du service worker
self.addEventListener('install', function(event) {
  console.log('Service Worker: Installation en cours...');
  
  // Force l'activation immédiate
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Service Worker: Mise en cache des fichiers');
        return Promise.all(
          urlsToCache.map(url => {
            return cache.add(url).catch(err => {
              console.error('Erreur cache pour:', url, err);
            });
          })
        );
      })
  );
});

// Activation du service worker
self.addEventListener('activate', function(event) {
  console.log('Service Worker: Activation');
  
  // Prend le contrôle immédiatement
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Suppression ancien cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Interception des requêtes - STRATÉGIE NETWORK FIRST
self.addEventListener('fetch', function(event) {
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  event.respondWith(
    // Essaie d'abord le réseau (pour avoir toujours la dernière version)
    fetch(event.request)
      .then(function(response) {
        // Si succès, met en cache ET retourne
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(function() {
        // Si échec réseau, utilise le cache
        return caches.match(event.request).then(function(response) {
          if (response) {
            return response;
          }
          return new Response('Application hors ligne', {
            status: 200,
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      })
  );
});