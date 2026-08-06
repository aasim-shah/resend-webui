'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Inbox, Send, AlertOctagon, FileText, Mail, Settings, PenSquare, Plus } from 'lucide-react';
import { useAccounts } from '@/context/AccountContext';

interface SidebarProps {
  onOpenCompose?: () => void;
  isCollapsed: boolean;
}

export function Sidebar({ onOpenCompose, isCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { accounts, activeFolder, setActiveFolder, selectedAccountId, setSelectedAccountId } = useAccounts();

  const isSettings = pathname === '/settings';

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
  };

  const handleAccountClick = (accountId: string) => {
    setSelectedAccountId(accountId);
    if (pathname !== '/') {
      router.push('/');
    }
  };

  return (
    <aside
      className={`bg-[#f6f8fc] flex flex-col justify-between h-[calc(100vh-5rem)] sticky top-20 z-10 transition-all duration-200 ease-in-out shrink-0 ${
        isCollapsed ? 'w-20 px-3' : 'w-64 px-5'
      }`}
    >
      <div className="space-y-6">
        {/* Compose Button with Top Spacing */}
        <div className="pt-6">
          {isCollapsed ? (
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
          {!isCollapsed && (
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
                title={isCollapsed ? folder.label : undefined}
                className={`w-full flex items-center ${
                  isCollapsed
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
                  {!isCollapsed && <span>{folder.label}</span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* Connected Profiles List */}
        {!isCollapsed && (
          <div className="px-3 pt-6 border-t border-slate-200/70 space-y-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Connected Profiles</span>
              <Link href="/settings" className="hover:text-slate-800" title="Manage Profiles">
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
          title={isCollapsed ? 'Settings & Keys' : undefined}
          className={`flex items-center ${
            isCollapsed ? 'justify-center w-12 h-12 mx-auto rounded-2xl' : 'px-4 py-3 rounded-2xl space-x-3.5'
          } text-xs font-semibold ${
            isSettings ? 'bg-blue-100/90 text-blue-800' : 'text-slate-700 hover:bg-slate-200/60'
          } transition-colors`}
        >
          <Settings className={`w-4 h-4 ${isSettings ? 'text-blue-700' : 'text-slate-500'}`} />
          {!isCollapsed && <span>Settings & Keys</span>}
        </Link>
      </div>
    </aside>
  );
}
