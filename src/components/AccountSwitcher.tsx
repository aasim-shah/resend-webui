'use client';

import React from 'react';
import { ResendAccount } from '@/lib/types';
import { ChevronDown, Check, ShieldCheck, Mail } from 'lucide-react';

interface AccountSwitcherProps {
  accounts: ResendAccount[];
  selectedAccountId: string;
  onSelectAccount: (id: string) => void;
}

export function AccountSwitcher({ accounts, selectedAccountId, onSelectAccount }: AccountSwitcherProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const selectedAccount =
    selectedAccountId === 'all'
      ? { id: 'all', name: 'All Connected Accounts', fromEmail: '3 Accounts Active', source: 'env' }
      : accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 text-sm bg-slate-900/90 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors shadow-sm"
      >
        <div className="flex items-center space-x-2.5 truncate">
          <div className="w-7 h-7 rounded-md bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-semibold shrink-0">
            {selectedAccountId === 'all' ? 'Σ' : selectedAccount?.name.charAt(0)}
          </div>
          <div className="text-left truncate">
            <div className="font-medium text-slate-200 text-xs truncate leading-tight">{selectedAccount?.name}</div>
            <div className="text-[11px] text-slate-400 truncate leading-tight">{selectedAccount?.fromEmail}</div>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-slate-900 border border-slate-800 rounded-lg shadow-xl overflow-hidden py-1">
            <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Select Resend Profile
            </div>

            <button
              onClick={() => {
                onSelectAccount('all');
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-slate-800 transition-colors ${
                selectedAccountId === 'all' ? 'bg-blue-600/10 text-blue-400' : 'text-slate-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <div>
                  <div className="font-medium">All Connected Accounts</div>
                  <div className="text-[10px] text-slate-400">Combined view</div>
                </div>
              </div>
              {selectedAccountId === 'all' && <Check className="w-3.5 h-3.5 text-blue-400" />}
            </button>

            <div className="my-1 border-t border-slate-800" />

            {accounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => {
                  onSelectAccount(acc.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-slate-800 transition-colors ${
                  selectedAccountId === acc.id ? 'bg-blue-600/10 text-blue-400' : 'text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <div className="truncate">
                    <div className="font-medium text-slate-200">{acc.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{acc.fromEmail}</div>
                  </div>
                </div>
                {selectedAccountId === acc.id && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
