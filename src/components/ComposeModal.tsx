'use client';

import React from 'react';
import { useAccounts } from '@/context/AccountContext';
import { X, Send, Eye, Code, AlertCircle, CheckCircle2, Paperclip, Bold, Italic, Link as LinkIcon, Sparkles, ChevronDown } from 'lucide-react';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ComposeModal({ isOpen, onClose, onSuccess }: ComposeModalProps) {
  const { accounts, selectedAccountId, triggerRefresh } = useAccounts();
  const [accountId, setAccountId] = React.useState<string>('aasim-shah');
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
    if (selectedAccountId && selectedAccountId !== 'all') {
      setAccountId(selectedAccountId);
    } else if (accounts.length > 0) {
      setAccountId(accounts[0].id);
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
            <div className="relative">
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="bg-white border border-slate-200/80 rounded-xl px-3 py-1 pr-7 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer appearance-none shadow-2xs"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.fromEmail})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2 pointer-events-none" />
            </div>

            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-200/60 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {feedback && (
          <div
            className={`px-6 py-2.5 text-xs flex items-center space-x-2 border-b font-medium ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSend} className="flex-1 flex flex-col overflow-hidden">
          {/* Borderless Seamless Field Rows */}
          <div className="divide-y divide-slate-100 text-xs bg-white">
            {/* To Row */}
            <div className="px-6 py-2.5 flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                <span className="w-14 font-semibold text-slate-400">To</span>
                <input
                  type="text"
                  required
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="recipient@domain.com"
                  className="flex-1 bg-transparent text-slate-900 font-medium placeholder-slate-400 focus:outline-none py-1"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowCcBcc(!showCcBcc)}
                className="text-[11px] text-slate-400 hover:text-blue-600 font-semibold transition-colors"
              >
                {showCcBcc ? 'Hide CC/BCC' : 'Cc / Bcc'}
              </button>
            </div>

            {/* CC / BCC Rows (Conditional) */}
            {showCcBcc && (
              <>
                <div className="px-6 py-2 flex items-center space-x-3">
                  <span className="w-14 font-semibold text-slate-400">Cc</span>
                  <input
                    type="text"
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    placeholder="cc@domain.com"
                    className="flex-1 bg-transparent text-slate-900 font-medium placeholder-slate-400 focus:outline-none py-1"
                  />
                </div>
                <div className="px-6 py-2 flex items-center space-x-3">
                  <span className="w-14 font-semibold text-slate-400">Bcc</span>
                  <input
                    type="text"
                    value={bcc}
                    onChange={(e) => setBcc(e.target.value)}
                    placeholder="bcc@domain.com"
                    className="flex-1 bg-transparent text-slate-900 font-medium placeholder-slate-400 focus:outline-none py-1"
                  />
                </div>
              </>
            )}

            {/* Subject Row */}
            <div className="px-6 py-2.5 flex items-center space-x-3">
              <span className="w-14 font-semibold text-slate-400">Subject</span>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter subject..."
                className="flex-1 bg-transparent text-slate-900 font-bold placeholder-slate-400 focus:outline-none py-1 text-sm"
              />
            </div>
          </div>

          {/* Formatting & Mode Control Bar */}
          <div className="px-6 py-2 bg-slate-50/60 border-y border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setActiveTab('write')}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors ${
                  activeTab === 'write' ? 'bg-white text-blue-600 shadow-2xs border border-slate-200/80' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Write
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors ${
                  activeTab === 'preview' ? 'bg-white text-blue-600 shadow-2xs border border-slate-200/80' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Preview
              </button>

              <span className="h-3 w-px bg-slate-200 mx-1" />

              <button
                type="button"
                onClick={() => setIsHtmlMode(!isHtmlMode)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  isHtmlMode ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                {isHtmlMode ? 'HTML Code Mode' : 'Plain Text Mode'}
              </button>
            </div>

            <label className="inline-flex items-center cursor-pointer text-xs space-x-2">
              <input
                type="checkbox"
                checked={isDryRun}
                onChange={(e) => setIsDryRun(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <span className="text-slate-500 font-semibold text-[11px]">Dry Run</span>
            </label>
          </div>

          {/* Clean Borderless Body Textarea Canvas */}
          <div className="flex-1 p-6 bg-white overflow-y-auto min-h-[220px]">
            {activeTab === 'write' ? (
              <textarea
                rows={9}
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                placeholder="Write your email here..."
                className={`w-full h-full bg-transparent resize-none focus:outline-none text-slate-800 text-sm leading-relaxed ${
                  isHtmlMode ? 'font-mono text-xs text-blue-900 bg-slate-50/50 p-4 rounded-xl border border-slate-200/80' : 'font-sans'
                }`}
              />
            ) : (
              <div className="p-4 bg-slate-50/50 border border-slate-200/80 rounded-2xl min-h-[200px] text-sm leading-relaxed text-slate-900">
                <div dangerouslySetInnerHTML={{ __html: isHtmlMode ? bodyText : formatAsHtml(bodyText) }} />
              </div>
            )}
          </div>

          {/* Clean Footer Bar */}
          <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-400 font-medium truncate max-w-[280px]">
              Sending via: <span className="font-mono text-slate-700 font-semibold">{activeAccount?.fromEmail}</span>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 flex items-center space-x-2 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Sending...' : isDryRun ? 'Dry Send' : 'Send Message'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
