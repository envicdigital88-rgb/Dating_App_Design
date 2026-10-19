self.addEventListener('push', function(event) {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: 'Wingle Mingle',
        body: event.data.text()
      };
    }
  } else {
    data = {
      title: 'Wingle Mingle',
      body: 'You have a new update!'
    };
  }

  const title = data.title || 'Wingle Mingle';
  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/web-app-manifest-192x192.png',
    badge: '/favicon-96x96.png',
    vibrate: [150, 75, 150, 75, 150],
    tag: data.tag || 'wm-notif-' + Date.now(),
    renotify: true,
    data: {
      dateOfArrival: Date.now(),
      url: data.url || '/discover'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const rawUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/discover';
  const targetUrl = new URL(rawUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // 1. Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // 2. If any app window is open, focus and navigate it
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if ('focus' in client && 'navigate' in client) {
          client.focus();
          return client.navigate(targetUrl);
        }
      }
      // 3. Open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

const CACHE = 'winglemingle-v3';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Exclude API routes, next data, Pusher requests, chrome extension schemes
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/data/') ||
    url.hostname.includes('pusher.com') ||
    !url.protocol.startsWith('http')
  ) {
    return;
  }

  // NAVIGATION REQUESTS (HTML page navigations): Network First!
  // This guarantees that when a signed-in user opens the app or visits '/',
  // the server immediately redirects them to '/discover', rather than serving
  // a stale cached landing page HTML!
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        const offlineLanding = await caches.match('/');
        if (offlineLanding) return offlineLanding;
        return new Response('You are offline. Please reconnect to use Wingle Mingle.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      })
    );
    return;
  }

  // STATIC ASSETS (images, fonts, scripts, css): Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        event.waitUntil(
          fetch(event.request).then((response) => {
            if (response && response.status === 200 && response.type === 'basic') {
              const toCache = response.clone();
              caches.open(CACHE).then((cache) => cache.put(event.request, toCache));
            }
          }).catch(() => {})
        );
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const toCache = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, toCache));
        return response;
      });
    })
  );
});

