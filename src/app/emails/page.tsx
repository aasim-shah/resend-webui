'use client';

import React from 'react';
import { Search, Mail, Download, RefreshCw, Eye, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { useAccounts } from '@/context/AccountContext';
import { EmailRecord } from '@/lib/types';
import { EmailInspectorModal } from '@/components/EmailInspectorModal';
import { apiFetch, mapEmail } from '@/lib/api/client';

export default function EmailsPage() {
  const { accounts, selectedAccountId, refreshTrigger } = useAccounts();
  const [emails, setEmails] = React.useState<EmailRecord[]>([]);
  const [filterAccount, setFilterAccount] = React.useState<string>(selectedAccountId || 'all');
  const [filterStatus, setFilterStatus] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(true);
  const [selectedEmail, setSelectedEmail] = React.useState<EmailRecord | null>(null);

  React.useEffect(() => {
    if (selectedAccountId) {
      setFilterAccount(selectedAccountId);
    }
  }, [selectedAccountId]);

  const fetchEmails = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterAccount && filterAccount !== 'all') params.set('profileId', filterAccount);
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (searchQuery) params.set('query', searchQuery);

      const res = await apiFetch(`/api/emails?${params.toString()}`);
      const data = await res.json();
      if (data.emails) {
        setEmails(data.emails.map(mapEmail));
      }
    } catch (err) {
      console.error('Failed to fetch emails:', err);
    } finally {
      setLoading(false);
    }
  }, [filterAccount, filterStatus, searchQuery]);

  React.useEffect(() => {
    fetchEmails();
  }, [fetchEmails, refreshTrigger]);

  const handleExportCsv = () => {
    if (emails.length === 0) return;
    const headers = ['ID', 'Account', 'From', 'To', 'Subject', 'Status', 'SentAt', 'DryRun'];
    const rows = emails.map((e) => [
      e.id,
      e.accountName,
      e.from,
      Array.isArray(e.to) ? e.to.join(';') : e.to,
      `"${e.subject.replace(/"/g, '""')}"`,
      e.status,
      e.sentAt,
      e.isDryRun ? 'Yes' : 'No',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `resend-emails-log-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'opened':
      case 'clicked':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'failed':
      case 'bounced':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-6 bg-white min-h-screen">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Email Dispatch History & Logs</h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete audit trail across Aasim Shah, CoreByte Studio, and FeedWink Resend accounts.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchEmails}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 transition-all text-xs font-semibold flex items-center space-x-2 shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Logs</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={emails.length === 0}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all text-xs font-semibold flex items-center space-x-2 shadow-xs disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/80 border border-slate-200/80 p-4 rounded-2xl">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recipient, subject..."
            className="w-full bg-white border border-slate-200/90 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all shadow-2xs"
          />
        </div>

        <div>
          <select
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            className="w-full bg-white border border-slate-200/90 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 shadow-2xs"
          >
            <option value="all">All Account Profiles</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.fromEmail})
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-white border border-slate-200/90 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 shadow-2xs"
          >
            <option value="all">All Statuses</option>
            <option value="sent">Sent</option>
            <option value="delivered">Delivered</option>
            <option value="opened">Opened</option>
            <option value="clicked">Clicked</option>
            <option value="bounced">Bounced</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Clean Table Container */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>Querying email database...</span>
          </div>
        ) : emails.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No emails matching your search filters were found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Subject & Recipient</th>
                  <th className="py-3.5 px-5">Sender Profile</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Timestamp</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {emails.map((email) => {
                  const toDisplay = Array.isArray(email.to) ? email.to.join(', ') : email.to;
                  return (
                    <tr key={email.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-semibold text-slate-900 max-w-md truncate">{email.subject}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5 max-w-md truncate">To: {toDisplay}</div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-semibold text-slate-800">{email.accountName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{email.from}</div>
                      </td>
                      <td className="py-4 px-5">
                        <span className={`px-2.5 py-0.5 rounded-md font-semibold border ${getStatusBadge(email.status)}`}>
                          {email.status.toUpperCase()}
                        </span>
                        {email.isDryRun && (
                          <span className="ml-1.5 text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-200 font-semibold">
                            DRY
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-slate-500 font-medium">
                        {new Date(email.sentAt).toLocaleString()}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => setSelectedEmail(email)}
                          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-all text-xs font-semibold"
                        >
                          Inspect Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <EmailInspectorModal email={selectedEmail} onClose={() => setSelectedEmail(null)} />
    </div>
  );
}
