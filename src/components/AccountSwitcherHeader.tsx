'use client';

import React from 'react';
import { useAccounts } from '@/context/AccountContext';
import { ChevronDown, Check, Mail, ShieldCheck, Plus, Layers } from 'lucide-react';

export function AccountSwitcherHeader() {
  const { accounts, selectedAccountId, setSelectedAccountId } = useAccounts();
  const [isOpen, setIsOpen] = React.useState(false);

  const activeAccount =
    selectedAccountId === 'all'
      ? { id: 'all', name: 'All Resend Accounts', fromEmail: `${accounts.length} Profiles Connected`, source: 'all' }
      : accounts.find((a) => a.id === selectedAccountId) || accounts[0];

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
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-3.5 py-1.5 bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl shadow-xs transition-all hover:bg-slate-50/80 text-left group"
      >
        <div
          className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center shadow-xs shrink-0 ${
            selectedAccountId === 'all' ? 'bg-slate-900 text-white' : getAccountBadgeColor(activeAccount?.source)
          }`}
        >
          {selectedAccountId === 'all' ? 'Σ' : activeAccount?.name.charAt(0)}
        </div>
        
        <div className="hidden sm:block text-left">
          <div className="text-xs font-semibold text-slate-800 leading-snug flex items-center gap-1.5">
            <span className="truncate max-w-[140px]">{activeAccount?.name}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          </div>
          <div className="text-[11px] text-slate-500 font-mono leading-none truncate max-w-[150px] mt-0.5">
            {activeAccount?.fromEmail}
          </div>
        </div>

        <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors ml-1 shrink-0" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200/90 rounded-2xl shadow-xl z-40 py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
              <span>Switch Resend Context</span>
              <span className="text-slate-500 font-mono text-[9px]">{accounts.length} Active</span>
            </div>

            {/* Combined View Option */}
            <div className="p-1">
              <button
                onClick={() => {
                  setSelectedAccountId('all');
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs text-left transition-colors ${
                  selectedAccountId === 'all' ? 'bg-blue-50/90 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">All Connected Accounts</div>
                    <div className="text-[11px] text-slate-500 font-normal">Combined unified inbox</div>
                  </div>
                </div>
                {selectedAccountId === 'all' && <Check className="w-4 h-4 text-blue-600" />}
              </button>
            </div>

            <div className="border-t border-slate-100 my-1" />

            <div className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Individual Accounts
            </div>

            <div className="p-1 space-y-0.5">
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => {
                    setSelectedAccountId(acc.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs text-left transition-colors ${
                    selectedAccountId === acc.id ? 'bg-blue-50/90 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <div className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 shadow-xs ${getAccountBadgeColor(acc.source)}`}>
                      {acc.name.charAt(0)}
                    </div>
                    <div className="truncate">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <span className="truncate">{acc.name}</span>
                        {acc.isDefault && (
                          <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200 font-medium">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono truncate">{acc.fromEmail}</div>
                    </div>
                  </div>
                  {selectedAccountId === acc.id && <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
