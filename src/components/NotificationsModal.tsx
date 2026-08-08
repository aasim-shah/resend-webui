'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { X, Mail, BellRing, Inbox } from 'lucide-react';
import { apiFetch } from '@/lib/api/client';
import { useNotifications } from '@/context/NotificationContext';
import { useDelayedUnmount } from '@/hooks/useDelayedUnmount';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  const router = useRouter();
  const { recentUnread, unreadCount, permission, notificationsEnabled, enableNotifications, refresh } =
    useNotifications();
  const shouldRender = useDelayedUnmount(isOpen, 160);

  const openEmail = async (id: string) => {
    onClose();
    router.push('/');
    try {
      await apiFetch(`/api/emails/${id}/read`, { method: 'PATCH' });
      refresh();
    } catch {
      // Best-effort; the inbox will still reflect the true read state next poll.
    }
  };

  if (!shouldRender) return null;

  return (
    <div
      className={`absolute right-0 mt-3 w-80 sm:w-96 max-w-[calc(100vw-2rem)] max-h-[75vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200/80 z-50 overflow-hidden ${
        isOpen ? 'dropdown-pop-in' : 'dropdown-pop-out'
      }`}
    >
      <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50/80">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <BellRing className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-slate-900 text-sm">Notifications</h2>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {unreadCount > 0 ? `${unreadCount} unread email${unreadCount === 1 ? '' : 's'}` : 'All caught up'}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {permission !== 'unsupported' && permission !== 'granted' && (
        <div className="px-4 sm:px-5 py-3 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between gap-3">
          <div className="text-[11px] text-blue-800 font-medium">
            {permission === 'denied'
              ? 'Notifications are blocked — allow them in your browser site settings.'
              : 'Enable browser notifications to get alerted about new mail, even with this tab closed.'}
          </div>
          {permission !== 'denied' && (
            <button
              onClick={enableNotifications}
              className="shrink-0 text-[11px] font-bold text-blue-700 bg-white border border-blue-200 px-2.5 py-1.5 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
            >
              Enable
            </button>
          )}
        </div>
      )}
      {permission === 'granted' && notificationsEnabled && (
        <div className="px-4 sm:px-5 py-2 bg-emerald-50/70 border-b border-emerald-100 text-[11px] text-emerald-800 font-medium">
          Browser notifications are on — new mail will alert you even with this tab closed.
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {recentUnread.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-14 text-slate-400">
            <Inbox className="w-8 h-8" />
            <div className="text-xs font-medium">No unread emails</div>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentUnread.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => openEmail(item.id)}
                  className="w-full text-left px-4 sm:px-5 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">{item.from}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">{timeAgo(item.sentAt)}</span>
                    </div>
                    <div className="text-xs text-slate-600 truncate mt-0.5">{item.subject}</div>
                    {item.profileName && (
                      <div className="text-[10px] text-slate-400 font-medium mt-1 truncate">{item.profileName}</div>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
