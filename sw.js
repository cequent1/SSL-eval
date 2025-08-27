// Service Worker pour l'application SSL Evaluation
const CACHE_NAME = 'ssl-eval-v4';
const urlsToCache = [
  './',
  './index.html',
];

// Installation du service worker
self.addEventListener('install', function(event) {
  console.log('Service Worker: Installation en cours...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Service Worker: Mise en cache des fichiers');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activation du service worker
self.addEventListener('activate', function(event) {
  console.log('Service Worker: Activation');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Service Worker: Mise en cache des fichiers');
        // Test chaque fichier individuellement
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

self.addEventListener('activate', function(event) {
  console.log('Service Worker: Activation');
  
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          // Supprime les anciens caches si nécessaire
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Suppression ancien cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interception des requêtes
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Retourne le fichier en cache s'il existe
        if (response) {
          return response;
        }
        
        // Sinon, va chercher sur le réseau
        return fetch(event.request).then(function(response) {
          // Vérifie si la réponse est valide
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone la réponse pour la mettre en cache
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(function(cache) {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      }
    )
  );
});