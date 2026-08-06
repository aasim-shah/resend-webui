'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, Search, SlidersHorizontal, Settings, RefreshCw, Check, Layers, Plus, LogOut, User as UserIcon } from 'lucide-react';
import { useAccounts } from '@/context/AccountContext';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  onToggleSidebar: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onRefresh: () => void;
  loading: boolean;
}

export function Header({ onToggleSidebar, searchQuery, onSearchChange, onRefresh, loading }: HeaderProps) {
  const router = useRouter();
  const { accounts, selectedAccountId, setSelectedAccountId } = useAccounts();
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    setIsProfileOpen(false);
    router.push('/login');
  };

  const activeAccount =
    selectedAccountId === 'all'
      ? { id: 'all', name: 'All Accounts', fromEmail: `${accounts.length} Profiles Connected`, source: 'all' }
      : accounts.find((a) => a.id === selectedAccountId) || accounts[0] || { name: 'Resend Account', fromEmail: 'Configure in Settings' };

  const getAccountBadgeColor = (source?: string) => {
    switch (source) {
      case 'env':
        return 'bg-blue-600 text-white';
      case 'env.corebyte':
        return 'bg-indigo-600 text-white';
      case 'env.feedwink':
        return 'bg-emerald-600 text-white';
      default:
        return 'bg-purple-600 text-white';
    }
  };

  return (
    <header className="h-20 px-8 flex items-center justify-between bg-[#f6f8fc] shrink-0 z-20">
      {/* Left: Menu & Brand Logo */}
      <div className="flex items-center space-x-4 w-72">
        <button
          onClick={onToggleSidebar}
          className="p-2.5 hover:bg-slate-200/60 rounded-2xl text-slate-700 transition-colors cursor-pointer"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm border border-slate-800 transition-transform group-hover:scale-105">
            <svg
              className="w-5 h-5 text-white fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M3 4.5A1.5 1.5 0 0 1 4.5 3h15A1.5 1.5 0 0 1 21 4.5v15a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5v-15ZM5 6v12h14V6L12 11.5 5 6Zm1.8 1.5 5.2 4.083L17.2 7.5H6.8Z" />
            </svg>
          </div>

          <div className="flex items-center">
            <span className="font-bold text-slate-900 text-lg tracking-tight">resend</span>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700 border border-slate-300/80 ml-1.5 shadow-2xs">
              webui
            </span>
          </div>
        </Link>
      </div>

      {/* Center: Search Bar */}
      <div className="flex-1 max-w-2xl px-6 hidden md:block">
        <div className="relative flex items-center bg-white hover:bg-slate-50 focus-within:bg-white focus-within:shadow-md border border-slate-200/80 rounded-2xl px-5 py-3 transition-all shadow-2xs">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Search emails by subject, sender, or content (⌘K)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-slate-800 text-sm placeholder-slate-400 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="text-xs text-slate-400 hover:text-slate-600 font-semibold px-2 py-1"
            >
              Clear
            </button>
          )}
          <SlidersHorizontal className="w-4 h-4 text-slate-400 ml-3 shrink-0 cursor-pointer hover:text-slate-600" />
        </div>
      </div>

      {/* Right: Actions & Account/User Profile Switcher */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onRefresh}
          className={`p-3 hover:bg-slate-200/60 rounded-2xl text-slate-600 transition-colors cursor-pointer ${
            loading ? 'animate-spin text-blue-600' : ''
          }`}
          title="Refresh Data"
        >
          <RefreshCw className="w-5 h-5" />
        </button>

        <Link
          href="/settings"
          className="p-3 hover:bg-slate-200/60 rounded-2xl text-slate-600 transition-colors"
          title="Settings & Accounts Hub"
        >
          <Settings className="w-5 h-5" />
        </Link>

        {/* Profile Avatar Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center space-x-3 p-1.5 hover:bg-slate-200/60 rounded-2xl transition-colors cursor-pointer border border-transparent hover:border-slate-200"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-700 text-white font-bold text-sm flex items-center justify-center shadow-xs">
              {(user?.name || activeAccount.name || 'A').charAt(0)}
            </div>
            <div className="text-left hidden lg:block pr-1">
              <div className="text-xs font-bold text-slate-900 leading-none flex items-center space-x-1">
                <span>{user?.name || activeAccount.name}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-blue-600 text-white">
                  WORKSPACE
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono truncate max-w-[160px] mt-0.5">
                {user?.email || activeAccount.fromEmail}
              </div>
            </div>
          </button>

          {/* Account Switcher & Auth Dropdown Modal */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* User Session Banner */}
              {user && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60 mb-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <UserIcon className="w-4 h-4 text-slate-500" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{user.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{user.email}</div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-1.5 hover:bg-slate-200/70 text-slate-600 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="px-3 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Resend Profiles</span>
                <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                  {accounts.length} Profiles
                </span>
              </div>

              <div className="mt-2 space-y-1.5">
                <button
                  onClick={() => {
                    setSelectedAccountId('all');
                    setIsProfileOpen(false);
                  }}
                  className={`w-full text-left p-3 rounded-2xl flex items-center justify-between transition-colors ${
                    selectedAccountId === 'all' ? 'bg-slate-100/80 border border-slate-200/80' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">All Profiles</div>
                      <div className="text-[10px] text-slate-500 font-mono">Aggregated Feed</div>
                    </div>
                  </div>
                  {selectedAccountId === 'all' && <Check className="w-4 h-4 text-blue-600" />}
                </button>

                {accounts.map((acc) => {
                  const isSelected = selectedAccountId === acc.id;
                  return (
                    <button
                      key={acc.id}
                      onClick={() => {
                        setSelectedAccountId(acc.id);
                        setIsProfileOpen(false);
                      }}
                      className={`w-full text-left p-3 rounded-2xl flex items-center justify-between transition-colors ${
                        isSelected ? 'bg-slate-100/80 border border-slate-200/80' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                          {acc.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">{acc.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono truncate">{acc.fromEmail}</div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href="/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1.5 px-3 py-1.5 rounded-xl hover:bg-blue-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Manage Profiles</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="text-xs font-bold text-slate-500 hover:text-rose-600 flex items-center space-x-1.5 px-3 py-1.5 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
