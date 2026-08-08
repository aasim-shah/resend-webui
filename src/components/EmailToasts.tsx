'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Mail, X } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';

/** Stack of in-app "new email" toasts shown while the tab is focused — see NotificationContext for when this fires vs. the OS notification. */
export function EmailToasts() {
  const { toasts, dismissToast, notificationPrivacy } = useNotifications();
  const router = useRouter();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 w-80 max-w-[calc(100vw-2rem)]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          onClick={() => {
            dismissToast(toast.id);
            router.push('/');
          }}
          className="toast-slide-in cursor-pointer bg-white border border-slate-200 shadow-lg rounded-2xl p-4 flex items-start gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Mail className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-slate-900 truncate">
              {toast.count > 1
                ? `${toast.count} new emails received`
                : notificationPrivacy === 'generic'
                  ? 'New email received'
                  : `New email from ${toast.from}`}
            </div>
            <div className="text-xs text-slate-500 truncate mt-0.5">
              {notificationPrivacy === 'generic' && toast.count === 1 ? 'Open your inbox to view it.' : toast.subject}
            </div>
            {notificationPrivacy === 'full' && toast.count === 1 && toast.profileName && (
              <div className="text-[10px] text-slate-400 font-medium mt-1 truncate">{toast.profileName}</div>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              dismissToast(toast.id);
            }}
            className="shrink-0 p-1 text-slate-300 hover:text-slate-600 rounded transition-colors cursor-pointer"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
