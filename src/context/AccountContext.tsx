'use client';

import React from 'react';
import { ResendAccount } from '@/lib/types';

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
  const [accounts, setAccounts] = React.useState<ResendAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = React.useState<string>('all');
  const [activeFolder, setActiveFolder] = React.useState<string>('inbox');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [refreshTrigger, setRefreshTrigger] = React.useState<number>(0);
  const [loading, setLoading] = React.useState(true);

  const triggerRefresh = () => setRefreshTrigger((prev) => prev + 1);

  const fetchAccounts = React.useCallback(async () => {
    try {
      const res = await fetch('/api/accounts');
      const data = await res.json();
      if (data.accounts) {
        setAccounts(data.accounts);
      }
    } catch (err) {
      console.error('Failed to load accounts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

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
