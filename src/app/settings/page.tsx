'use client';

import React from 'react';
import { Key, Globe, Layers, Copy, Plus, Trash2, CheckCircle2, AlertCircle, RefreshCw, ShieldCheck, Eye, EyeOff, Settings2, ExternalLink, Bell, BellOff, MonitorSmartphone, Lock } from 'lucide-react';
import { useAccounts } from '@/context/AccountContext';
import { useNotifications, NotificationPrivacy } from '@/context/NotificationContext';
import { DomainRecord } from '@/lib/types';
import { apiFetch, mapDomain } from '@/lib/api/client';

function ToggleSwitch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`cursor-pointer relative w-10 h-6 rounded-full transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
        checked ? 'bg-blue-600' : 'bg-slate-300'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { accounts, refreshAccounts } = useAccounts();
  const {
    permission,
    notificationsEnabled,
    enableNotifications,
    toastEnabled,
    setToastEnabled,
    notificationPrivacy,
    setNotificationPrivacy,
  } = useNotifications();
  const [activeTab, setActiveTab] = React.useState<'accounts' | 'domains' | 'campaigns' | 'webhooks' | 'notifications'>('accounts');

  // Add Account Form State
  const [name, setName] = React.useState('');
  const [apiKey, setApiKey] = React.useState('');
  const [fromEmail, setFromEmail] = React.useState('');
  const [fromName, setFromName] = React.useState('');
  const [webhookSecret, setWebhookSecret] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showApiKey, setShowApiKey] = React.useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = React.useState(false);

  // Edit Account Field (per existing account) State
  type EditableField = 'name' | 'apiKey' | 'fromEmail' | 'fromName' | 'webhookSecret';
  const [editingField, setEditingField] = React.useState<{ id: string; field: EditableField } | null>(null);
  const [editFieldValue, setEditFieldValue] = React.useState('');
  const [savingField, setSavingField] = React.useState(false);

  // Domains State
  const [domains, setDomains] = React.useState<DomainRecord[]>([]);
  const [loadingDomains, setLoadingDomains] = React.useState(false);

  // Webhooks State
  const [copiedWebhook, setCopiedWebhook] = React.useState(false);
  const webhookUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/webhooks/resend`;

  const fetchDomains = React.useCallback(async () => {
    setLoadingDomains(true);
    try {
      const res = await apiFetch('/api/domains');
      const data = await res.json();
      if (data.domains) setDomains(data.domains.map(mapDomain));
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
      const res = await apiFetch('/api/profiles', {
        method: 'POST',
        body: JSON.stringify({ name, apiKey, fromEmail, fromName, webhookSecret: webhookSecret || undefined }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to add account');

      setFeedback({ type: 'success', message: `Account "${name}" added successfully!` });
      setName('');
      setApiKey('');
      setFromEmail('');
      setFromName('');
      setWebhookSecret('');

      if (refreshAccounts) refreshAccounts();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error adding account' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditField = (id: string, field: EditableField, currentValue: string = '') => {
    setEditingField({ id, field });
    setEditFieldValue(currentValue);
  };

  const cancelEditField = () => {
    setEditingField(null);
    setEditFieldValue('');
  };

  const saveEditField = async () => {
    if (!editingField) return;
    const { id, field } = editingField;
    const value = editFieldValue.trim();
    if (field !== 'fromName' && !value) return;

    setSavingField(true);
    try {
      const res = await apiFetch(`/api/profiles/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ [field]: value }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to save changes');

      setFeedback({ type: 'success', message: 'Account updated.' });
      cancelEditField();
      if (refreshAccounts) refreshAccounts();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error saving changes' });
    } finally {
      setSavingField(false);
    }
  };

  const renderEditableRow = (
    accId: string,
    field: EditableField,
    label: string,
    displayValue: string,
    options: { mono?: boolean; type?: string; placeholder?: string; prefill?: boolean } = {}
  ) => {
    const isEditing = editingField?.id === accId && editingField.field === field;

    if (isEditing) {
      return (
        <div key={field} className="pt-1 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <input
              type={options.type || 'text'}
              autoFocus
              value={editFieldValue}
              onChange={(e) => setEditFieldValue(e.target.value)}
              placeholder={options.placeholder}
              className={`w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs ${
                options.mono ? 'font-mono' : ''
              } text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20`}
            />
          </div>
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={cancelEditField}
              className="cursor-pointer px-2 py-1 rounded-md text-slate-500 hover:bg-slate-100 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={savingField || (field !== 'fromName' && !editFieldValue.trim())}
              onClick={saveEditField}
              className="cursor-pointer px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold"
            >
              {savingField ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div key={field} className="flex justify-between items-center gap-2">
        <dt className="text-slate-500 shrink-0">{label}</dt>
        <dd className="flex items-center gap-1.5 min-w-0">
          <span
            className={`font-mono truncate max-w-[140px] ${displayValue ? 'text-slate-700' : 'text-amber-600'}`}
          >
            {displayValue || 'Not set'}
          </span>
          <button
            type="button"
            onClick={() => startEditField(accId, field, options.prefill ? displayValue : '')}
            className="cursor-pointer text-blue-600 hover:text-blue-700 text-[11px] font-semibold underline underline-offset-2 shrink-0"
          >
            {displayValue ? 'Edit' : 'Set'}
          </button>
        </dd>
      </div>
    );
  };

  const handleDeleteAccount = async (id: string, accName: string) => {
    if (!confirm(`Are you sure you want to remove account "${accName}"?`)) return;

    try {
      const res = await apiFetch(`/api/profiles/${id}`, { method: 'DELETE' });
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

  const tabs: { id: typeof activeTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'accounts', label: 'Accounts & API Keys', icon: Key, badge: accounts.length },
    { id: 'domains', label: 'Domain Verification', icon: Globe },
    { id: 'campaigns', label: 'Campaign Presets', icon: Layers },
    { id: 'webhooks', label: 'Inbound Webhooks', icon: ShieldCheck },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-8 bg-white h-full overflow-y-auto">
      {/* Header Title */}
      <div className="flex items-start gap-3.5 pb-6 border-b border-slate-200">
        <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <Settings2 className="w-5.5 h-5.5" strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Mail Control & Settings Center</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage Resend API keys, domain DNS verification, bulk email campaign settings, and webhooks.
          </p>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div
        role="tablist"
        aria-label="Settings sections"
        className="inline-flex flex-wrap items-center gap-1 bg-slate-100 rounded-xl p-1 text-sm"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`cursor-pointer flex items-center gap-2 rounded-lg px-3.5 py-2 font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {typeof tab.badge === 'number' && (
                <span
                  className={`text-xs font-semibold rounded-full px-1.5 py-px ${
                    isActive ? 'bg-blue-50 text-blue-700' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Account Management & API Keys */}
      {activeTab === 'accounts' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="group bg-white border border-slate-200 p-4 rounded-2xl space-y-3.5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-150"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                      {acc.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 text-sm truncate">{acc.name}</h3>
                      <p className="text-xs text-slate-500 font-mono truncate">{acc.fromEmail}</p>
                    </div>
                  </div>

                  {acc.source === 'custom' && (
                    <button
                      onClick={() => handleDeleteAccount(acc.id, acc.name)}
                      className="cursor-pointer p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                      aria-label={`Remove account ${acc.name}`}
                      title="Remove account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full w-fit px-2 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active
                </div>

                <dl className="pt-3 border-t border-slate-100 text-xs space-y-1.5">
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Source</dt>
                    <dd className="text-slate-700 font-mono font-medium capitalize">{acc.source}</dd>
                  </div>
                  {renderEditableRow(acc.id, 'name', 'Name', acc.name, { prefill: true, placeholder: 'Account label' })}
                  {renderEditableRow(acc.id, 'apiKey', 'API Key', acc.apiKeyMasked || '', {
                    mono: true,
                    placeholder: 're_...',
                  })}
                  {renderEditableRow(acc.id, 'fromEmail', 'From Email', acc.fromEmail, {
                    mono: true,
                    type: 'email',
                    prefill: true,
                    placeholder: 'contact@domain.com',
                  })}
                  {renderEditableRow(acc.id, 'fromName', 'Display Name', acc.fromName || '', {
                    prefill: true,
                    placeholder: 'Brand Name',
                  })}
                  {renderEditableRow(acc.id, 'webhookSecret', 'Webhook Secret', acc.hasWebhookSecret ? acc.webhookSecretMasked || '' : '', {
                    mono: true,
                    placeholder: 'whsec_...',
                  })}
                </dl>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-5">
            <div>
              <h2 className="font-semibold text-slate-900 text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                Add Resend Account Profile
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Connect an additional Resend API key to start sending and receiving emails from it.
              </p>
            </div>

            {feedback && (
              <div
                role="alert"
                aria-live="polite"
                className={`p-3 rounded-lg text-sm flex items-center gap-2 border ${
                  feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                <span>{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handleAddAccount} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="account-label" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Account Label <span className="text-rose-500">*</span>
                </label>
                <input
                  id="account-label"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sales Team / Product X"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-shadow"
                />
              </div>

              <div>
                <label htmlFor="api-key" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Resend API Key <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="api-key"
                    type={showApiKey ? 'text' : 'password'}
                    required
                    autoComplete="off"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="re_123456789..."
                    className="w-full bg-white border border-slate-200 rounded-lg pl-3 pr-9 py-2.5 text-sm font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-shadow"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey((v) => !v)}
                    className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Found in your Resend dashboard under API Keys.</p>
              </div>

              <div>
                <label htmlFor="from-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Default From Email <span className="text-rose-500">*</span>
                </label>
                <input
                  id="from-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  placeholder="contact@domain.com"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-shadow"
                />
              </div>

              <div>
                <label htmlFor="from-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Display Name <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  id="from-name"
                  type="text"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  placeholder="Brand Name"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-shadow"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="webhook-secret" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Webhook Signing Secret <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <input
                    id="webhook-secret"
                    type={showWebhookSecret ? 'text' : 'password'}
                    autoComplete="off"
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    placeholder="whsec_..."
                    className="w-full bg-white border border-slate-200 rounded-lg pl-3 pr-9 py-2.5 text-sm font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-shadow"
                  />
                  <button
                    type="button"
                    onClick={() => setShowWebhookSecret((v) => !v)}
                    className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    aria-label={showWebhookSecret ? 'Hide webhook secret' : 'Show webhook secret'}
                  >
                    {showWebhookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  From this account&apos;s Resend Webhooks settings (Signing Secret). Each Resend account has its own — set it here so inbound events route to the right account instead of relying on a single shared secret.
                </p>
              </div>

              <div className="md:col-span-2 flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="cursor-pointer px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg shadow-sm flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
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
            <h2 className="font-semibold text-slate-900 text-base">Resend Domain Verification Records</h2>
            <button
              onClick={fetchDomains}
              className="cursor-pointer px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 text-sm font-medium flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingDomains ? 'animate-spin' : ''}`} />
              <span>Refresh Status</span>
            </button>
          </div>

          {loadingDomains ? (
            <div className="p-10 text-center text-sm text-slate-500 flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-slate-400" />
              Querying domain DNS records...
            </div>
          ) : domains.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center mx-auto">
                <Globe className="w-5 h-5 text-slate-400" />
              </div>
              <div className="font-semibold text-slate-800 text-sm">Sender Domains Configured in Code</div>
              <p className="text-slate-500 text-sm">
                Active domains: <strong className="text-slate-700 font-mono font-medium">aasimshah.com</strong>, <strong className="text-slate-700 font-mono font-medium">corebytestudio.com</strong>, <strong className="text-slate-700 font-mono font-medium">feedwink.com</strong>.
              </p>
              <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
                <a href="https://resend.com/domains" target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700 underline underline-offset-2 inline-flex items-center gap-1">
                  Open Resend Domains Console <ExternalLink className="w-3 h-3" />
                </a>
                to add new DKIM/SPF domain keys.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {domains.map((d) => (
                <div key={d.id} className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between text-sm shadow-sm hover:border-slate-300 transition-colors">
                  <div>
                    <div className="font-semibold text-slate-900">{d.name}</div>
                    <div className="text-slate-500 text-xs mt-0.5">Account: {d.accountName}</div>
                  </div>
                  <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-semibold border border-emerald-100">
                    <CheckCircle2 className="w-3.5 h-3.5" />
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
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-3">
          <h2 className="font-semibold text-slate-900 text-base">Campaign & Batch List Presets</h2>
          <p className="text-slate-600 text-sm">
            Saved outreach campaign JSON files detected in your project repository:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-sm hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-2 font-mono font-semibold text-slate-800 text-xs">
                <Layers className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="truncate">campaign.feedwink.canada-50.json</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">50 FeedWink Canada Prospects</div>
            </div>
            <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-sm hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-2 font-mono font-semibold text-slate-800 text-xs">
                <Layers className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="truncate">recipients.corebyte.twin-cities-50.json</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">50 CoreByte Twin Cities Prospects</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Webhooks */}
      {activeTab === 'webhooks' && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-3">
          <h2 className="font-semibold text-slate-900 text-base">Resend Inbound Webhook Listener</h2>
          <p className="text-slate-600 text-sm">
            Paste this same URL into the Webhooks settings of every Resend account you connect, to auto-sync delivery, opens, clicks, and inbound email events:
          </p>
          <div className="flex items-center gap-2 bg-white border border-slate-200 p-3 rounded-xl font-mono text-sm text-blue-700">
            <span className="flex-1 truncate">{webhookUrl}</span>
            <button
              onClick={copyWebhook}
              className="cursor-pointer shrink-0 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-sans font-semibold text-xs flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {copiedWebhook ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedWebhook ? 'Copied!' : 'Copy Endpoint'}
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Each Resend account issues its own signing secret for this URL — copy it from that account&apos;s webhook settings and paste it into the account&apos;s
            {' '}
            <strong className="font-semibold text-slate-700">Webhook Signing Secret</strong> field under the{' '}
            <strong className="font-semibold text-slate-700">Accounts &amp; API Keys</strong> tab. Incoming events are matched to an account by verifying against
            each stored secret, so accounts without one configured won&apos;t have their inbound events attributed correctly.
          </p>
        </div>
      )}

      {/* Tab 5: Notifications */}
      {activeTab === 'notifications' && (
        <div className="space-y-5 max-w-2xl">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                {permission === 'denied' ? <BellOff className="w-4.5 h-4.5" /> : <Bell className="w-4.5 h-4.5" />}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-slate-900 text-base">Browser Notifications</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  {permission === 'denied'
                    ? 'Blocked in your browser’s site settings. Allow notifications for this site to re-enable.'
                    : permission === 'granted' && notificationsEnabled
                      ? 'A native OS notification pops up when new mail arrives while this tab isn’t focused.'
                      : 'Get an OS-level popup for new mail when you’re away from this tab — in another window, or another app entirely.'}
                </p>
              </div>
              {permission !== 'granted' && permission !== 'unsupported' && (
                <button
                  onClick={enableNotifications}
                  disabled={permission === 'denied'}
                  className="cursor-pointer shrink-0 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-lg transition-colors"
                >
                  Enable
                </button>
              )}
              {permission === 'granted' && (
                <span className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Allowed
                </span>
              )}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <MonitorSmartphone className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-slate-900 text-base">In-App Toasts</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Show a toast in the corner of the screen when new mail arrives while you&apos;re actively using this tab.
                </p>
              </div>
              <ToggleSwitch checked={toastEnabled} onChange={setToastEnabled} label="Toggle in-app toasts" />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Lock className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-slate-900 text-base">Notification Privacy</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Control how much of a new email&apos;s content shows up in toasts and OS notifications &mdash; useful when
                  screen-sharing or presenting.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              {(
                [
                  { value: 'full', title: 'Show sender & subject', desc: 'e.g. "New email from jane@acme.com — Q3 proposal"' },
                  { value: 'generic', title: 'Show a generic message only', desc: 'e.g. "New email received" — no sender or subject shown' },
                ] as { value: NotificationPrivacy; title: string; desc: string }[]
              ).map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    notificationPrivacy === opt.value ? 'border-blue-300 bg-blue-50/60' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="notification-privacy"
                    checked={notificationPrivacy === opt.value}
                    onChange={() => setNotificationPrivacy(opt.value)}
                    className="mt-0.5 accent-blue-600 cursor-pointer"
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-800">{opt.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
