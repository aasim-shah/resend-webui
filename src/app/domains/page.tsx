'use client';

import React from 'react';
import { Globe, RefreshCw } from 'lucide-react';
import { useAccounts } from '@/context/AccountContext';
import { DomainRecord } from '@/lib/types';
import { apiFetch, mapDomain } from '@/lib/api/client';

export default function DomainsPage() {
  const { selectedAccountId } = useAccounts();
  const [domains, setDomains] = React.useState<DomainRecord[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  const fetchDomains = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedAccountId && selectedAccountId !== 'all') {
        params.set('profileId', selectedAccountId);
      }
      const res = await apiFetch(`/api/domains?${params.toString()}`);
      const data = await res.json();
      if (data.domains) {
        setDomains(data.domains.map(mapDomain));
      }
    } catch (err) {
      console.error('Failed to fetch domains:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId]);

  React.useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">Domain Health & Verification</h1>
          <p className="text-xs text-slate-400 mt-1">
            Check SPF, DKIM, DMARC, and MX DNS verification status across all Resend accounts.
          </p>
        </div>

        <button
          onClick={fetchDomains}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 transition-colors text-xs flex items-center space-x-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Domain Status</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs flex items-center justify-center space-x-2">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
          <span>Querying Resend Domain APIs...</span>
        </div>
      ) : domains.length === 0 ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
          <Globe className="w-10 h-10 text-slate-600 mx-auto" />
          <h2 className="font-semibold text-slate-200 text-sm">Configured Sender Domains</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Sender addresses configured in your repo:
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <span className="bg-slate-800 text-blue-400 px-3 py-1 rounded-full text-xs font-mono border border-slate-700">
              aasimshah.com (contact@aasimshah.com)
            </span>
            <span className="bg-slate-800 text-blue-400 px-3 py-1 rounded-full text-xs font-mono border border-slate-700">
              corebytestudio.com (info@corebytestudio.com)
            </span>
            <span className="bg-slate-800 text-blue-400 px-3 py-1 rounded-full text-xs font-mono border border-slate-700">
              feedwink.com (sales@feedwink.com)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 pt-2">
            Tip: Log into the <a href="https://resend.com/domains" target="_blank" rel="noreferrer" className="text-blue-400 underline">Resend Domains Console</a> to add and manage domain records directly.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {domains.map((domain) => (
            <div key={domain.id} className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-100 text-sm">{domain.name}</h3>
                    <p className="text-[11px] text-slate-400">Account Profile: <strong className="text-slate-200">{domain.accountName}</strong></p>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded text-xs font-medium border ${
                    domain.status === 'verified' || domain.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}
                >
                  {domain.status.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
