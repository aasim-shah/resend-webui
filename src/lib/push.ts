import { apiFetch } from '@/lib/api/client';

/** PushManager.subscribe wants the VAPID key as a Uint8Array, but the backend hands it out base64url-encoded. */
function urlBase64ToUint8Array(base64Url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/**
 * Registers the app's service worker independent of Push/Notification permission — a
 * service worker controlling the page is also one of the browser's installability
 * criteria for "Add to Home Screen" / the desktop install prompt, so this needs to run
 * on every load, not just once the user opts into notifications.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | undefined> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return undefined;
  return navigator.serviceWorker.register('/sw.js');
}

/**
 * Subscribes the service worker to Web Push, so new-mail notifications keep arriving even
 * once every tab is closed — a plain `Notification` popup (used elsewhere for the
 * foreground/background-tab case) only works while a tab is open. No-ops quietly if the
 * browser lacks Push support or the backend has no VAPID keys configured.
 */
export async function subscribeToPush(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

  const keyRes = await apiFetch('/api/push/vapid-public-key');
  if (!keyRes.ok) return;
  const { publicKey, configured } = await keyRes.json();
  if (!configured || !publicKey) return;

  const registration = (await registerServiceWorker()) ?? (await navigator.serviceWorker.register('/sw.js'));
  await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    });
  }

  const json = subscription.toJSON();
  await apiFetch('/api/push/subscribe', {
    method: 'POST',
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: json.keys,
      userAgent: navigator.userAgent,
    }),
  });
}
