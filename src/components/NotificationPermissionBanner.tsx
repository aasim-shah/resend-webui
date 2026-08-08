'use client';

import React from 'react';
import { Bell, X } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';

const DISMISSED_KEY = 'resend-webui:notification-banner-dismissed';

/**
 * A soft, in-app ask shown before the real browser permission dialog. Chrome (and
 * others) downgrade Notification.requestPermission() to a muted address-bar icon
 * when it isn't triggered by a genuine click, so this exists to earn that click
 * instead of firing the native prompt unprompted on mount.
 */
export function NotificationPermissionBanner() {
  const { permission, enableNotifications } = useNotifications();
  const [dismissed, setDismissed] = React.useState(true);

  React.useEffect(() => {
    setDismissed(localStorage.getItem(DISMISSED_KEY) === '1');
  }, []);

  if (permission !== 'default' || dismissed) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
  };

  return (
    <div className="flex items-center justify-between gap-4 px-6 py-2.5 bg-blue-50 border-b border-blue-100 text-xs shrink-0">
      <div className="flex items-center gap-2.5 text-blue-900">
        <Bell className="w-4 h-4 text-blue-600 shrink-0" />
        <span className="font-medium">Get notified in your browser the moment new mail arrives.</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={enableNotifications}
          className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors cursor-pointer"
        >
          Enable notifications
        </button>
        <button
          onClick={dismiss}
          className="p-1.5 rounded-lg text-blue-400 hover:text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
          title="Not now"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
