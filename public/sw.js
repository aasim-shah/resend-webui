// Service worker with two jobs:
//  1. Receive Web Push events and show an OS notification — lets new-mail notifications
//     reach the user even when no tab is open (the plain Notification API used elsewhere
//     in this app only fires while a tab is open). See NotificationContext.tsx for the
//     subscribe flow that registers this file, and resend-webui-api's push.service.ts
//     for what sends to it.
//  2. Satisfy the "has a controlling service worker" install-ability criterion so the app
//     can be installed as a standalone PWA (see app/manifest.ts for the rest of that).
// Deliberately does NOT cache/serve responses offline — this is a live inbox, and stale
// cached email data would be actively misleading.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // No-op: falls through to normal network handling. Presence of this handler is what
  // browsers check for install-ability; deliberately not calling respondWith() here.
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'New email received', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'New email received';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body,
      tag: data.tag,
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) client.navigate(targetUrl);
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
