'use client';

import React from 'react';
import { ResendAccount } from '@/lib/types';
import { apiFetch, mapProfileToAccount } from '@/lib/api/client';
import { useAuth } from '@/context/AuthContext';

interface AccountContextType {
  accounts: ResendAccount[];
  selectedAccountId: string;
  setSelectedAccountId: (id: string) => void;
  activeFolder: string;
  setActiveFolder: (folder: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
  refreshAccounts: () => void;
  loading: boolean;
}

const SELECTED_ACCOUNT_STORAGE_KEY = 'resend-webui:selected-account-id';

const AccountContext = React.createContext<AccountContextType>({
  accounts: [],
  selectedAccountId: 'all',
  setSelectedAccountId: () => {},
  activeFolder: 'inbox',
  setActiveFolder: () => {},
  searchQuery: '',
  setSearchQuery: () => {},
  refreshTrigger: 0,
  triggerRefresh: () => {},
  refreshAccounts: () => {},
  loading: true,
});

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [accounts, setAccounts] = React.useState<ResendAccount[]>([]);
  const [selectedAccountId, setSelectedAccountIdState] = React.useState<string>('all');
  const [activeFolder, setActiveFolder] = React.useState<string>('inbox');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [refreshTrigger, setRefreshTrigger] = React.useState<number>(0);
  const [loading, setLoading] = React.useState(true);

  // Read after mount (not as the useState initializer) so server and first client
  // render match — reading localStorage during the initializer would mismatch SSR output.
  React.useEffect(() => {
    const stored = localStorage.getItem(SELECTED_ACCOUNT_STORAGE_KEY);
    if (stored) setSelectedAccountIdState(stored);
  }, []);

  const setSelectedAccountId = React.useCallback((id: string) => {
    setSelectedAccountIdState(id);
    localStorage.setItem(SELECTED_ACCOUNT_STORAGE_KEY, id);
  }, []);

  const triggerRefresh = () => setRefreshTrigger((prev) => prev + 1);

  const fetchAccounts = React.useCallback(async () => {
    try {
      const res = await apiFetch('/api/profiles');
      const data = await res.json();
      if (data.profiles) {
        setAccounts(data.profiles.map(mapProfileToAccount));
      } else {
        setAccounts([]);
      }
    } catch (err) {
      console.error('Failed to load accounts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (user) {
      fetchAccounts();
    } else {
      setAccounts([]);
      setLoading(false);
    }
  }, [user, fetchAccounts]);

  // A stored selection may point at a profile that's since been removed
  // (e.g. deleted from another device) — fall back to "All Profiles" rather
  // than silently filtering everything down to zero results.
  React.useEffect(() => {
    if (loading || accounts.length === 0 || selectedAccountId === 'all') return;
    if (!accounts.some((a) => a.id === selectedAccountId)) {
      setSelectedAccountId('all');
    }
  }, [loading, accounts, selectedAccountId, setSelectedAccountId]);

  return (
    <AccountContext.Provider
      value={{
        accounts,
        selectedAccountId,
        setSelectedAccountId,
        activeFolder,
        setActiveFolder,
        searchQuery,
        setSearchQuery,
        refreshTrigger,
        triggerRefresh,
        refreshAccounts: fetchAccounts,
        loading,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccounts() {
  return React.useContext(AccountContext);
}
