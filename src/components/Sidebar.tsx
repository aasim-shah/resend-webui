'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Inbox, Send, AlertOctagon, FileText, Mail, Settings, PenSquare, Plus } from 'lucide-react';
import { useAccounts } from '@/context/AccountContext';
import { useDelayedUnmount } from '@/hooks/useDelayedUnmount';

interface SidebarProps {
  onOpenCompose?: () => void;
  isCollapsed: boolean;
  isMobileNavOpen?: boolean;
  onCloseMobileNav?: () => void;
}

export function Sidebar({ onOpenCompose, isCollapsed, isMobileNavOpen = false, onCloseMobileNav }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { accounts, activeFolder, setActiveFolder, selectedAccountId, setSelectedAccountId } = useAccounts();

  const showMobileBackdrop = useDelayedUnmount(isMobileNavOpen, 200);
  const isSettings = pathname === '/settings';
  // The mobile drawer always renders expanded (labels visible) regardless of
  // the desktop icon-only collapse state, which only applies at lg+.
  const collapsed = isCollapsed && !isMobileNavOpen;

  const folders = [
    { id: 'inbox', label: 'Inbox', icon: Inbox },
    { id: 'sent', label: 'Sent', icon: Send },
    { id: 'spam', label: 'Spam & Bounced', icon: AlertOctagon },
    { id: 'drafts', label: 'Drafts', icon: FileText },
    { id: 'all', label: 'All Mail', icon: Mail },
  ];

  const handleFolderClick = (folderId: string) => {
    setActiveFolder(folderId);
    if (pathname !== '/') {
      router.push('/');
    }
    onCloseMobileNav?.();
  };

  const handleAccountClick = (accountId: string) => {
    setSelectedAccountId(accountId);
    if (pathname !== '/') {
      router.push('/');
    }
    onCloseMobileNav?.();
  };

  return (
    <>
      {/* Mobile backdrop — closes the drawer on outside tap */}
      {showMobileBackdrop && (
        <div
          className={`fixed inset-x-0 top-16 sm:top-20 bottom-0 z-30 bg-slate-900/40 lg:hidden ${isMobileNavOpen ? 'modal-backdrop-in' : 'modal-backdrop-out'}`}
          onClick={onCloseMobileNav}
          aria-hidden="true"
        />
      )}

      <aside
        className={`bg-[#f6f8fc] flex flex-col justify-between overflow-y-auto transition-[transform,width,padding] duration-200 ease-in-out shrink-0
          fixed top-16 sm:top-20 bottom-0 left-0 z-40 w-72 px-5 pt-4 pb-4 shadow-2xl
          ${isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:translate-x-0 lg:shadow-none lg:z-10 lg:h-[calc(100vh-5rem)] lg:sticky lg:top-20 lg:pt-0 lg:pb-0
          ${collapsed ? 'lg:w-20 lg:px-3' : 'lg:w-64 lg:px-5'}`}
      >
        <div className="space-y-6">
          <div>
            {collapsed ? (
            <button
              onClick={onOpenCompose}
              className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center justify-center shadow-md shadow-blue-600/20 transition-all cursor-pointer mx-auto"
              title="Compose Email"
            >
              <PenSquare className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={onOpenCompose}
              className="w-full py-3.5 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center space-x-2.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <PenSquare className="w-4 h-4" />
              <span>Compose Email</span>
            </button>
          )}
        </div>

        {/* Spaced Folder Navigation List */}
        <div className="space-y-2">
          {!collapsed && (
            <div className="px-3 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Mailboxes
            </div>
          )}

          {folders.map((folder) => {
            const Icon = folder.icon;
            const isActive = !isSettings && activeFolder === folder.id;

            return (
              <button
                key={folder.id}
                onClick={() => handleFolderClick(folder.id)}
                title={collapsed ? folder.label : undefined}
                className={`w-full flex items-center ${
                  collapsed
                    ? 'justify-center w-12 h-12 mx-auto rounded-2xl'
                    : 'justify-between px-4 py-3 rounded-2xl'
                } text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-100/90 text-blue-800 font-bold shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-700' : 'text-slate-500'}`} />
                  {!collapsed && <span>{folder.label}</span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* Connected Profiles List */}
        {!collapsed && (
          <div className="px-3 pt-6 border-t border-slate-200/70 space-y-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Connected Profiles</span>
              <Link href="/settings" className="hover:text-slate-800" title="Manage Profiles" onClick={() => onCloseMobileNav?.()}>
                <Plus className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-1.5">
              {accounts.map((acc) => {
                const isSelected = selectedAccountId === acc.id;
                return (
                  <button
                    key={acc.id}
                    onClick={() => handleAccountClick(acc.id)}
                    className={`w-full flex items-center space-x-2.5 text-xs font-semibold truncate px-3 py-2 rounded-xl transition-all cursor-pointer ${
                      isSelected ? 'bg-blue-100/90 text-blue-900 font-bold shadow-2xs' : 'text-slate-700 hover:bg-slate-200/60'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isSelected ? 'bg-blue-600 animate-pulse' : 'bg-slate-400'}`} />
                    <span className="truncate">{acc.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Settings Link */}
      <div className="pb-6 pt-3 border-t border-slate-200/70">
        <Link
          href="/settings"
          title={collapsed ? 'Settings & Keys' : undefined}
          onClick={() => onCloseMobileNav?.()}
          className={`flex items-center ${
            collapsed ? 'justify-center w-12 h-12 mx-auto rounded-2xl' : 'px-4 py-3 rounded-2xl space-x-3.5'
          } text-xs font-semibold ${
            isSettings ? 'bg-blue-100/90 text-blue-800' : 'text-slate-700 hover:bg-slate-200/60'
          } transition-colors`}
        >
          <Settings className={`w-4 h-4 ${isSettings ? 'text-blue-700' : 'text-slate-500'}`} />
          {!collapsed && <span>Settings & Keys</span>}
        </Link>
      </div>
      </aside>
    </>
  );
}
