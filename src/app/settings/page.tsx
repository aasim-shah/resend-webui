'use client';

import React from 'react';
import { Key, Globe, Layers, Copy, Plus, Trash2, CheckCircle2, AlertCircle, RefreshCw, Send, ShieldCheck } from 'lucide-react';
import { useAccounts } from '@/context/AccountContext';
import { DomainRecord } from '@/lib/types';

export default function SettingsPage() {
  const { accounts, refreshAccounts } = useAccounts();
  const [activeTab, setActiveTab] = React.useState<'accounts' | 'domains' | 'campaigns' | 'webhooks'>('accounts');

  // Add Account Form State
  const [name, setName] = React.useState('');
  const [apiKey, setApiKey] = React.useState('');
  const [fromEmail, setFromEmail] = React.useState('');
  const [fromName, setFromName] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Domains State
  const [domains, setDomains] = React.useState<DomainRecord[]>([]);
  const [loadingDomains, setLoadingDomains] = React.useState(false);

  // Webhooks State
  const [copiedWebhook, setCopiedWebhook] = React.useState(false);
  const webhookUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/resend` : '/api/webhooks/resend';

  const fetchDomains = React.useCallback(async () => {
    setLoadingDomains(true);
    try {
      const res = await fetch('/api/domains');
      const data = await res.json();
      if (data.domains) setDomains(data.domains);
    } catch (err) {
      console.error('Failed to load domains:', err);
    } finally {
      setLoadingDomains(false);
    }
  }, []);

  React.useEffect(() => {
    if (activeTab === 'domains') {
      fetchDomains();
    }
  }, [activeTab, fetchDomains]);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, apiKey, fromEmail, fromName }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to add account');

      setFeedback({ type: 'success', message: `Account "${name}" added successfully!` });
      setName('');
      setApiKey('');
      setFromEmail('');
      setFromName('');

      if (refreshAccounts) refreshAccounts();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error adding account' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async (id: string, accName: string) => {
    if (!confirm(`Are you sure you want to remove account "${accName}"?`)) return;

    try {
      const res = await fetch(`/api/accounts?id=${id}`, { method: 'DELETE' });
      if (res.ok && refreshAccounts) refreshAccounts();
    } catch (err) {
      console.error('Error removing account:', err);
    }
  };

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 bg-white min-h-screen">
      {/* Header Title */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Mail Control & Settings Center</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage Resend API keys, domain DNS verification, bulk email campaign settings, and webhooks.
        </p>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-4 text-xs font-medium">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors ${
            activeTab === 'accounts' ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Accounts & API Keys ({accounts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('domains')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors ${
            activeTab === 'domains' ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Domain DNS Verification</span>
        </button>

        <button
          onClick={() => setActiveTab('campaigns')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors ${
            activeTab === 'campaigns' ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Campaign & Bulk Presets</span>
        </button>

        <button
          onClick={() => setActiveTab('webhooks')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors ${
            activeTab === 'webhooks' ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Inbound Webhooks</span>
        </button>
      </div>

      {/* Tab 1: Account Management & API Keys */}
      {activeTab === 'accounts' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {accounts.map((acc) => (
              <div key={acc.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                      {acc.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-xs">{acc.name}</h3>
                      <p className="text-[10px] text-slate-500 font-mono">{acc.fromEmail}</p>
                    </div>
                  </div>

                  {acc.source === 'custom' && (
                    <button
                      onClick={() => handleDeleteAccount(acc.id, acc.name)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove Account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200 text-[11px] space-y-1">
                  <div className="flex justify-between text-slate-500">
                    <span>Source:</span>
                    <span className="text-slate-800 font-mono font-medium">{acc.source}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Key:</span>
                    <span className="text-slate-800 font-mono">{acc.apiKeyMasked}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-slate-900 text-sm">Add Resend Account Profile</h2>
            <p className="text-xs text-slate-500">
              Connect an additional Resend API key to start sending and receiving emails from it.
            </p>

            {feedback && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center space-x-2 border ${
                  feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                <span>{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handleAddAccount} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Label</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sales Team / Product X"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Resend API Key</label>
                <input
                  type="password"
                  required
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="re_123456789..."
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Default From Email</label>
                <input
                  type="email"
                  required
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  placeholder="contact@domain.com"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Display Name (Optional)</label>
                <input
                  type="text"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  placeholder="Brand Name"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2 flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSubmitting ? 'Adding...' : 'Save Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 2: Domain Verification */}
      {activeTab === 'domains' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 text-sm">Resend Domain Verification Records</h2>
            <button
              onClick={fetchDomains}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 text-xs font-medium flex items-center space-x-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingDomains ? 'animate-spin' : ''}`} />
              <span>Refresh Status</span>
            </button>
          </div>

          {loadingDomains ? (
            <div className="p-8 text-center text-xs text-slate-500">Querying domain DNS records...</div>
          ) : domains.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center space-y-2 text-xs">
              <Globe className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="font-semibold text-slate-800">Sender Domains Configured in Code</div>
              <p className="text-slate-500">
                Active domains: <strong>aasimshah.com</strong>, <strong>corebytestudio.com</strong>, <strong>feedwink.com</strong>.
              </p>
              <p className="text-[11px] text-slate-400">
                Log into <a href="https://resend.com/domains" target="_blank" rel="noreferrer" className="text-blue-600 underline">Resend Domains Console</a> to add new DKIM/SPF domain keys.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {domains.map((d) => (
                <div key={d.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{d.name}</div>
                    <div className="text-slate-500 text-[11px]">Account: {d.accountName}</div>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded font-semibold border border-emerald-200">
                    {d.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Campaigns */}
      {activeTab === 'campaigns' && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-3 text-xs">
          <h2 className="font-semibold text-slate-900 text-sm">Campaign & Batch List Presets</h2>
          <p className="text-slate-600">
            Saved outreach campaign JSON files detected in your project repository:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="bg-white border border-slate-200 p-3 rounded-lg font-mono">
              <div className="font-semibold text-slate-800 text-xs">campaign.feedwink.canada-50.json</div>
              <div className="text-[11px] text-slate-500">50 FeedWink Canada Prospects</div>
            </div>
            <div className="bg-white border border-slate-200 p-3 rounded-lg font-mono">
              <div className="font-semibold text-slate-800 text-xs">recipients.corebyte.twin-cities-50.json</div>
              <div className="text-[11px] text-slate-500">50 CoreByte Twin Cities Prospects</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Webhooks */}
      {activeTab === 'webhooks' && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-3 text-xs">
          <h2 className="font-semibold text-slate-900 text-sm">Resend Inbound Webhook Listener</h2>
          <p className="text-slate-600">
            Paste this URL into your Resend Webhooks settings to auto-sync delivery, opens, clicks, and inbound email events:
          </p>
          <div className="flex items-center space-x-2 bg-white border border-slate-200 p-3 rounded-lg font-mono text-xs text-blue-700">
            <span className="flex-1 truncate">{webhookUrl}</span>
            <button
              onClick={copyWebhook}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-sans font-semibold text-[11px] transition-colors"
            >
              {copiedWebhook ? 'Copied!' : 'Copy Endpoint'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
