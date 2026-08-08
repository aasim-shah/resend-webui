'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Send, Eye, Code, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAccounts } from '@/context/AccountContext';
import { apiFetch } from '@/lib/api/client';

function ComposeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountFromQuery = searchParams.get('account');
  const { accounts, selectedAccountId } = useAccounts();

  const [accountId, setAccountId] = React.useState<string>('');
  const [to, setTo] = React.useState<string>('');
  const [cc, setCc] = React.useState<string>('');
  const [bcc, setBcc] = React.useState<string>('');
  const [subject, setSubject] = React.useState<string>('');
  const [htmlContent, setHtmlContent] = React.useState<string>(
    '<h2>Hello {{name}},</h2>\n<p>Thank you for reaching out to us. We have received your inquiry regarding <strong>{{topic}}</strong>.</p>\n<p>Best regards,<br/>Our Team</p>'
  );
  const [isDryRun, setIsDryRun] = React.useState<boolean>(false);
  const [activeTab, setActiveTab] = React.useState<'editor' | 'preview'>('editor');
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [feedback, setFeedback] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const idempotencyKeyRef = React.useRef<string>(crypto.randomUUID());

  React.useEffect(() => {
    if (accountFromQuery) {
      setAccountId(accountFromQuery);
    } else if (selectedAccountId && selectedAccountId !== 'all') {
      setAccountId(selectedAccountId);
    } else if (accounts.length > 0) {
      setAccountId(accounts[0].id);
    }
  }, [accountFromQuery, selectedAccountId, accounts]);

  const activeAccount = accounts.find((a) => a.id === accountId) || accounts[0];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setIsSubmitting(true);

    try {
      const recipientList = to
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await apiFetch('/api/emails/send', {
        method: 'POST',
        body: JSON.stringify({
          profileId: accountId,
          to: recipientList.length === 1 ? recipientList[0] : recipientList,
          cc: cc ? cc.split(',').map((s) => s.trim()) : undefined,
          bcc: bcc ? bcc.split(',').map((s) => s.trim()) : undefined,
          subject,
          html: htmlContent,
          isDryRun,
          idempotencyKey: idempotencyKeyRef.current,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to send email');
      }

      idempotencyKeyRef.current = crypto.randomUUID();

      setFeedback({
        type: 'success',
        message: data.message || 'Email dispatched successfully!',
      });

      if (!isDryRun) {
        setTimeout(() => {
          router.push('/emails');
        }, 1500);
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'An unexpected error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 px-3 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">Compose & Dispatch Email</h1>
          <p className="text-xs text-slate-400 mt-1">
            Send directly via selected Resend account profile with live preview & variable support.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-1.5 rounded-xl">
          <label className="text-[11px] text-slate-400 font-medium px-2">Sender Profile:</label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="min-w-0 flex-1 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 font-medium"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.fromEmail})
              </option>
            ))}
          </select>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center space-x-3 border ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSend} className="space-y-5">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 shrink-0">
              {activeAccount?.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-slate-200 truncate">{activeAccount?.name} Profile</div>
              <div className="text-[11px] text-slate-400 font-mono truncate">
                From Address: <strong className="text-slate-300">{activeAccount?.fromEmail}</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <label className="inline-flex items-center cursor-pointer text-xs space-x-2">
              <input
                type="checkbox"
                checked={isDryRun}
                onChange={(e) => setIsDryRun(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
              />
              <span className="text-slate-300 font-medium">Dry Run (Simulate Send)</span>
            </label>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              To Recipient(s) <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="e.g. client@example.com, john@company.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
            <p className="text-[10px] text-slate-500 mt-1">Separate multiple recipients with commas</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">CC (Optional)</label>
              <input
                type="text"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="cc@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">BCC (Optional)</label>
              <input
                type="text"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                placeholder="bcc@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Subject Line <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800 text-xs">
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1.5 rounded-md font-medium flex items-center space-x-1.5 transition-colors ${
                  activeTab === 'editor' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>HTML Code Editor</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-md font-medium flex items-center space-x-1.5 transition-colors ${
                  activeTab === 'preview' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live Rendered Preview</span>
              </button>
            </div>
          </div>

          <div className="p-4">
            {activeTab === 'editor' ? (
              <textarea
                rows={12}
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-blue-300 focus:outline-none focus:border-blue-500 leading-relaxed"
              />
            ) : (
              <div className="bg-white rounded-lg p-6 text-slate-900 min-h-[250px] shadow-inner">
                <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
          <div className="text-xs text-slate-400 truncate">
            Sending via Resend SDK account: <strong className="text-slate-200">{activeAccount?.name}</strong>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto justify-center px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-500/25 flex items-center space-x-2 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Dispatching...' : isDryRun ? 'Simulate Dry Send' : 'Send Email Now'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ComposePage() {
  return (
    <Suspense fallback={<div className="p-12 text-slate-400 text-xs">Loading composer...</div>}>
      <ComposeForm />
    </Suspense>
  );
}
