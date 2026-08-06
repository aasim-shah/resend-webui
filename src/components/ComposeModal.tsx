'use client';

import React from 'react';
import Link from 'next/link';
import { useAccounts } from '@/context/AccountContext';
import { X, Send, Eye, Code, AlertCircle, CheckCircle2, Paperclip, Bold, Italic, Link as LinkIcon, Sparkles, ChevronDown, PlusCircle } from 'lucide-react';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ComposeModal({ isOpen, onClose, onSuccess }: ComposeModalProps) {
  const { accounts, selectedAccountId, triggerRefresh } = useAccounts();
  const [accountId, setAccountId] = React.useState<string>('');
  const [to, setTo] = React.useState<string>('');
  const [cc, setCc] = React.useState<string>('');
  const [bcc, setBcc] = React.useState<string>('');
  const [subject, setSubject] = React.useState<string>('');
  const [bodyText, setBodyText] = React.useState<string>(
    'Hi there,\n\nWriting to follow up regarding our recent project updates. Let me know if you have any questions.\n\nBest regards,\nTeam'
  );
  const [isHtmlMode, setIsHtmlMode] = React.useState<boolean>(false);
  const [isDryRun, setIsDryRun] = React.useState<boolean>(false);
  const [activeTab, setActiveTab] = React.useState<'write' | 'preview'>('write');
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [feedback, setFeedback] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showCcBcc, setShowCcBcc] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (selectedAccountId && selectedAccountId !== 'all' && accounts.some((a) => a.id === selectedAccountId)) {
      setAccountId(selectedAccountId);
    } else if (accounts.length > 0) {
      setAccountId(accounts[0].id);
    } else {
      setAccountId('');
    }
  }, [selectedAccountId, accounts]);

  if (!isOpen) return null;

  const activeAccount = accounts.find((a) => a.id === accountId) || accounts[0];

  const formatAsHtml = (text: string) => {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => `<p>${line}</p>`)
      .join('');
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!accountId || accounts.length === 0) {
      setFeedback({
        type: 'error',
        message: 'No connected Resend API key found. Please navigate to Settings to connect a profile.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const recipientList = to
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const finalHtml = isHtmlMode ? bodyText : formatAsHtml(bodyText);

      const res = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          to: recipientList.length === 1 ? recipientList[0] : recipientList,
          cc: cc ? cc.split(',').map((s) => s.trim()) : undefined,
          bcc: bcc ? bcc.split(',').map((s) => s.trim()) : undefined,
          subject,
          html: finalHtml,
          text: bodyText,
          isDryRun,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to dispatch email');
      }

      setFeedback({ type: 'success', message: data.message || 'Email sent successfully!' });
      setTimeout(() => {
        onClose();
        triggerRefresh();
        if (onSuccess) onSuccess();
      }, 1000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error sending email' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/30 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Sleek Header Bar */}
        <div className="px-6 py-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <h2 className="font-bold text-slate-900 text-xs tracking-tight">New Message</h2>
          </div>

          {/* Account Selector & Close Button */}
          <div className="flex items-center space-x-3">
            {accounts.length > 0 ? (
              <div className="relative">
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="appearance-none bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 text-[11px] font-bold py-1.5 pl-3 pr-7 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.fromEmail})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            ) : (
              <Link
                href="/settings"
                onClick={onClose}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl flex items-center space-x-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Connect API Key</span>
              </Link>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`px-6 py-2.5 text-xs font-semibold flex items-center justify-between border-b ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            {accounts.length === 0 && (
              <Link
                href="/settings"
                onClick={onClose}
                className="text-xs font-bold text-rose-900 underline hover:text-rose-950"
              >
                Open Settings
              </Link>
            )}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSend} className="flex-1 flex flex-col min-h-0">
          {/* Recipient Fields */}
          <div className="px-6 py-2 border-b border-slate-100 space-y-2">
            <div className="flex items-center">
              <span className="text-xs font-bold text-slate-400 w-12 shrink-0">To</span>
              <input
                type="text"
                required
                placeholder="recipient@example.com"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full text-xs font-medium text-slate-900 bg-transparent border-none outline-none py-1.5 focus:ring-0 placeholder-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowCcBcc(!showCcBcc)}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-600 px-2 cursor-pointer"
              >
                Cc / Bcc
              </button>
            </div>

            {showCcBcc && (
              <>
                <div className="flex items-center pt-1 border-t border-slate-50">
                  <span className="text-xs font-bold text-slate-400 w-12 shrink-0">Cc</span>
                  <input
                    type="text"
                    placeholder="cc@example.com"
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    className="w-full text-xs font-medium text-slate-900 bg-transparent border-none outline-none py-1 focus:ring-0 placeholder-slate-400"
                  />
                </div>
                <div className="flex items-center pt-1 border-t border-slate-50">
                  <span className="text-xs font-bold text-slate-400 w-12 shrink-0">Bcc</span>
                  <input
                    type="text"
                    placeholder="bcc@example.com"
                    value={bcc}
                    onChange={(e) => setBcc(e.target.value)}
                    className="w-full text-xs font-medium text-slate-900 bg-transparent border-none outline-none py-1 focus:ring-0 placeholder-slate-400"
                  />
                </div>
              </>
            )}
          </div>

          {/* Subject Field */}
          <div className="px-6 py-2 border-b border-slate-100 flex items-center">
            <span className="text-xs font-bold text-slate-400 w-12 shrink-0">Subject</span>
            <input
              type="text"
              required
              placeholder="Email subject..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full text-xs font-bold text-slate-900 bg-transparent border-none outline-none py-1.5 focus:ring-0 placeholder-slate-400"
            />
          </div>

          {/* Format Switcher & Editor Toolbar */}
          <div className="px-6 py-2 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-1 p-0.5 bg-slate-200/60 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('write')}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  activeTab === 'write' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Write
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  activeTab === 'preview' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Preview
              </button>
            </div>

            <div className="flex items-center space-x-3 text-xs font-medium text-slate-600">
              <button
                type="button"
                onClick={() => setIsHtmlMode(!isHtmlMode)}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                  isHtmlMode ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200/60 text-slate-500'
                }`}
              >
                {isHtmlMode ? 'HTML Source' : 'Plain Text Mode'}
              </button>

              <label className="flex items-center space-x-1.5 cursor-pointer text-[11px] font-bold text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={isDryRun}
                  onChange={(e) => setIsDryRun(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Dry Run</span>
              </label>
            </div>
          </div>

          {/* Editor Body */}
          <div className="flex-1 p-6 overflow-y-auto min-h-[180px]">
            {activeTab === 'write' ? (
              <textarea
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                placeholder="Write your email body here..."
                className="w-full h-full min-h-[160px] bg-transparent border-none outline-none text-xs leading-relaxed text-slate-800 placeholder-slate-400 font-mono resize-none focus:ring-0"
              />
            ) : (
              <div className="prose prose-slate max-w-none text-xs">
                {isHtmlMode ? (
                  <div dangerouslySetInnerHTML={{ __html: bodyText }} />
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: formatAsHtml(bodyText) }} />
                )}
              </div>
            )}
          </div>

          {/* Sleek Footer Actions */}
          <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between shrink-0">
            <div className="text-[11px] text-slate-400 font-mono">
              {activeAccount ? (
                <>Sending via: <span className="font-bold text-slate-700">{activeAccount.fromEmail}</span></>
              ) : (
                <span className="text-rose-600 font-bold">No API key connected</span>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 hover:bg-slate-200/60 rounded-xl text-xs font-bold text-slate-600 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || accounts.length === 0}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
