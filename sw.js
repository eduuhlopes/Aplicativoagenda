const CACHE_NAME = 'spaco-delas-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/logo.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache and caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          // We don't cache chrome-extension:// requests
          if (event.request.url.startsWith('http')) {
             cache.put(event.request, responseToCache);
          }
        });
        return networkResponse;
      }).catch(error => {
        console.error('Fetch failed:', error);
      });
    })
  );
});

self.addEventListener('push', event => {
  console.log('[Service Worker] Push Received.');
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error('Push event data is not JSON', e);
      data = { title: 'Nova Notificação', body: event.data.text() };
    }
  } else {
    data = { title: 'Spaço Delas', body: 'Você tem um novo lembrete!' };
  }

  const title = data.title || 'Spaço Delas';
  const options = {
    body: data.body || 'Lembrete de agendamento.',
    icon: '/logo.png',
    badge: '/logo.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'spaco-delas-notification',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification click Received.');
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then(clientList => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === self.location.origin + '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});