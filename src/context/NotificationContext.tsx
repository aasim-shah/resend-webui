'use client';

import React from 'react';
import { apiFetch, API_BASE } from '@/lib/api/client';
import { applyFavicon } from '@/lib/favicon';
import { registerServiceWorker, subscribeToPush } from '@/lib/push';
import { useAuth } from '@/context/AuthContext';
import { useAccounts } from '@/context/AccountContext';

// New mail arrives over the /api/emails/stream SSE connection below; this is just a
// safety net in case that stream silently stalls (e.g. a proxy buffering it) without
// firing an `error` event that would trigger the browser's native reconnect.
const SAFETY_POLL_INTERVAL_MS = 90_000;
const STORAGE_KEY = 'resend-webui:notifications-enabled';
const TOAST_STORAGE_KEY = 'resend-webui:toast-enabled';
const PRIVACY_STORAGE_KEY = 'resend-webui:notification-privacy';
const TOAST_AUTO_DISMISS_MS = 6_000;
// Bulk sends can plausibly draw a burst of replies/bounces back at once — cap how many
// toasts stack on screen at a time, and how many notified-ids we remember, so neither
// grows unbounded in a tab that's left open all day.
const MAX_VISIBLE_TOASTS = 4;
const MAX_NOTIFIED_IDS = 500;

export type NotificationPrivacy = 'full' | 'generic';

interface UnreadSummaryEmail {
  id: string;
  from: string;
  subject: string;
  profileName?: string;
  sentAt: string;
}

export interface EmailToast {
  id: string;
  /** 1 for a single email; >1 for a consolidated "N new emails" toast. */
  count: number;
  from: string;
  subject: string;
  profileName?: string;
}

export type RecentUnreadEmail = UnreadSummaryEmail;

interface NotificationContextType {
  unreadCount: number;
  recentUnread: RecentUnreadEmail[];
  permission: NotificationPermission | 'unsupported';
  notificationsEnabled: boolean;
  enableNotifications: () => Promise<void>;
  /** Re-fetches the unread summary immediately instead of waiting for the next poll tick. */
  refresh: () => void;
  toasts: EmailToast[];
  dismissToast: (id: string) => void;
  toastEnabled: boolean;
  setToastEnabled: (enabled: boolean) => void;
  notificationPrivacy: NotificationPrivacy;
  setNotificationPrivacy: (privacy: NotificationPrivacy) => void;
}

const NotificationContext = React.createContext<NotificationContextType>({
  unreadCount: 0,
  recentUnread: [],
  permission: 'unsupported',
  notificationsEnabled: false,
  enableNotifications: async () => {},
  refresh: () => {},
  toasts: [],
  dismissToast: () => {},
  toastEnabled: true,
  setToastEnabled: () => {},
  notificationPrivacy: 'full',
  setNotificationPrivacy: () => {},
});

/** True while this tab is the one the user is actually looking at. */
function isForegroundTab(): boolean {
  return typeof document !== 'undefined' && document.visibilityState === 'visible' && document.hasFocus();
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { triggerRefresh } = useAccounts();
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [recentUnread, setRecentUnread] = React.useState<RecentUnreadEmail[]>([]);
  const [permission, setPermission] = React.useState<NotificationPermission | 'unsupported'>('unsupported');
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(false);
  const [toasts, setToasts] = React.useState<EmailToast[]>([]);
  const [toastEnabled, setToastEnabledState] = React.useState(true);
  const [notificationPrivacy, setNotificationPrivacyState] = React.useState<NotificationPrivacy>('full');
  // Tracks which unread emails we've already surfaced a notification for, so
  // re-polling the same unread inbox doesn't re-notify every cycle.
  const notifiedIds = React.useRef<Set<string>>(new Set());
  // First poll after mount/login seeds notifiedIds from whatever's already unread
  // instead of firing a notification burst for pre-existing unread mail.
  const hasBaseline = React.useRef(false);

  // Independent of notification permission — a controlling service worker is also part
  // of the browser's "installable PWA" criteria, so it needs to register unconditionally.
  React.useEffect(() => {
    registerServiceWorker().catch(() => {
      // Best-effort; install-ability and push both degrade gracefully without it.
    });
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const granted = Notification.permission === 'granted';
    setPermission(Notification.permission);
    setNotificationsEnabled(granted && localStorage.getItem(STORAGE_KEY) !== 'off');
    setToastEnabledState(localStorage.getItem(TOAST_STORAGE_KEY) !== 'off');
    const storedPrivacy = localStorage.getItem(PRIVACY_STORAGE_KEY);
    setNotificationPrivacyState(storedPrivacy === 'generic' ? 'generic' : 'full');
    // Re-syncs the push subscription for anyone who granted permission in an earlier
    // session, before background push existed — not just for a fresh grant below.
    if (granted) {
      subscribeToPush().catch(() => {
        // Best-effort; the tab-open Notification API path still works either way.
      });
    }
  }, []);

  const enableNotifications = React.useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
    const enabled = result === 'granted';
    setNotificationsEnabled(enabled);
    localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
    if (enabled) {
      subscribeToPush().catch(() => {
        // Best-effort; the tab-open Notification API path still works either way.
      });
    }
  }, []);

  const setToastEnabled = React.useCallback((enabled: boolean) => {
    setToastEnabledState(enabled);
    localStorage.setItem(TOAST_STORAGE_KEY, enabled ? 'on' : 'off');
  }, []);

  const setNotificationPrivacy = React.useCallback((privacy: NotificationPrivacy) => {
    setNotificationPrivacyState(privacy);
    localStorage.setItem(PRIVACY_STORAGE_KEY, privacy);
  }, []);

  const dismissToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = React.useCallback((toast: EmailToast) => {
    // Drop the oldest once we're at capacity instead of growing the stack forever.
    setToasts((prev) => [...prev.slice(-(MAX_VISIBLE_TOASTS - 1)), toast]);
    setTimeout(() => dismissToast(toast.id), TOAST_AUTO_DISMISS_MS);
  }, [dismissToast]);

  /** Marks ids as notified, trimming the oldest entries once the set grows past its cap. */
  const markNotified = React.useCallback((ids: string[]) => {
    const set = notifiedIds.current;
    ids.forEach((id) => set.add(id));
    if (set.size > MAX_NOTIFIED_IDS) {
      const excess = set.size - MAX_NOTIFIED_IDS;
      const it = set.values();
      for (let i = 0; i < excess; i++) {
        const next = it.next();
        if (next.done) break;
        set.delete(next.value);
      }
    }
  }, []);

  const poll = React.useCallback(async () => {
    try {
      const res = await apiFetch('/api/emails/unread-summary');
      if (!res.ok) return;
      const data: { unreadCount: number; recent: UnreadSummaryEmail[] } = await res.json();

      setUnreadCount(data.unreadCount);
      setRecentUnread(data.recent);
      applyFavicon(data.unreadCount > 0);

      if (!hasBaseline.current) {
        markNotified(data.recent.map((e) => e.id));
        hasBaseline.current = true;
        return;
      }

      const newOnes = data.recent.filter((e) => !notifiedIds.current.has(e.id));
      if (newOnes.length === 0) return;
      markNotified(newOnes.map((e) => e.id));

      const canNotify =
        notificationsEnabled && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
      const foreground = isForegroundTab();

      // A bulk send can plausibly draw several replies/bounces back at once — surface
      // that as one consolidated toast/notification instead of spamming a popup per
      // email (native OS notifications don't collapse across different tags).
      const isBatch = newOnes.length > 1;
      const id = isBatch ? `batch-${Date.now()}` : newOnes[0].id;
      const title = isBatch
        ? `${newOnes.length} new emails received`
        : notificationPrivacy === 'generic'
          ? 'New email received'
          : `New email from ${newOnes[0].from}`;
      const body = isBatch
        ? notificationPrivacy === 'generic'
          ? 'Open your inbox to view them.'
          : newOnes.slice(0, 3).map((e) => e.from).join(', ') + (newOnes.length > 3 ? `, and ${newOnes.length - 3} more` : '')
        : notificationPrivacy === 'generic'
          ? 'Open your inbox to view it.'
          : newOnes[0].subject;

      // While this tab is focused, an in-app toast is enough — a simultaneous OS
      // popup on top of the page the user is already looking at is just noise.
      // Once they're elsewhere (another window, another app), fall back to the
      // OS notification so it still reaches them.
      if (foreground && toastEnabled) {
        pushToast({
          id,
          count: newOnes.length,
          from: isBatch ? '' : newOnes[0].from,
          subject: isBatch ? body : newOnes[0].subject,
          profileName: isBatch ? undefined : newOnes[0].profileName,
        });
      } else if (canNotify) {
        const n = new Notification(title, { body, tag: isBatch ? undefined : id });
        n.onclick = () => {
          window.focus();
          n.close();
        };
      }
    } catch {
      // Best-effort polling; a transient network blip shouldn't surface to the user.
    }
  }, [notificationsEnabled, notificationPrivacy, toastEnabled, pushToast, markNotified]);

  // poll/triggerRefresh are read through refs inside the SSE effect below so that
  // reconnecting the stream only depends on [user] — not on every unrelated
  // re-render of AccountContext (search query keystrokes, folder switches, etc.).
  const pollRef = React.useRef(poll);
  React.useEffect(() => {
    pollRef.current = poll;
  }, [poll]);

  const triggerRefreshRef = React.useRef(triggerRefresh);
  React.useEffect(() => {
    triggerRefreshRef.current = triggerRefresh;
  }, [triggerRefresh]);

  React.useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setRecentUnread([]);
      applyFavicon(false);
      hasBaseline.current = false;
      notifiedIds.current.clear();
      return;
    }

    pollRef.current();
    const safetyPoll = setInterval(() => pollRef.current(), SAFETY_POLL_INTERVAL_MS);

    // Push channel for new inbound mail / delivery-status changes. EventSource
    // reconnects natively on drop; each (re)connect re-syncs via pollRef so any
    // events missed while disconnected are still picked up.
    const source = new EventSource(`${API_BASE}/api/emails/stream`, { withCredentials: true });

    source.addEventListener('open', () => {
      pollRef.current();
    });
    source.addEventListener('email.received', () => {
      pollRef.current();
      triggerRefreshRef.current();
    });
    source.addEventListener('email.status', () => {
      triggerRefreshRef.current();
    });
    source.onerror = () => {
      // Best-effort push channel; the browser retries the connection automatically,
      // and the safety-net poll above keeps the badge correct in the meantime.
    };

    return () => {
      clearInterval(safetyPoll);
      source.close();
    };
  }, [user]);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        recentUnread,
        permission,
        notificationsEnabled,
        enableNotifications,
        refresh: poll,
        toasts,
        dismissToast,
        toastEnabled,
        setToastEnabled,
        notificationPrivacy,
        setNotificationPrivacy,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return React.useContext(NotificationContext);
}
