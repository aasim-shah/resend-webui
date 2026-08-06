'use client';

import React, { Suspense } from 'react';
import {
  RefreshCw,
  Mail,
  ArrowLeft,
  CornerUpLeft,
  Copy,
  Check,
  Star,
  Filter,
  Share,
  Archive,
  Trash2,
  MailOpen,
  Clock,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  CheckSquare,
  Square,
} from 'lucide-react';
import { useAccounts } from '@/context/AccountContext';
import { EmailRecord } from '@/lib/types';
import { ComposeModal } from '@/components/ComposeModal';

function WebmailHome() {
  const { accounts, selectedAccountId, activeFolder, searchQuery, refreshTrigger } = useAccounts();

  const [emails, setEmails] = React.useState<EmailRecord[]>([]);
  const [selectedEmail, setSelectedEmail] = React.useState<EmailRecord | null>(null);
  const [filterStatus, setFilterStatus] = React.useState<string>('all');
  const [starredIds, setStarredIds] = React.useState<Record<string, boolean>>({});
  const [selectedIds, setSelectedIds] = React.useState<Record<string, boolean>>({});
  const [selectAll, setSelectAll] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [isComposeOpen, setIsComposeOpen] = React.useState<boolean>(false);
  const [activeTab, setActiveTab] = React.useState<'rendered' | 'raw'>('rendered');
  const [copiedId, setCopiedId] = React.useState<boolean>(false);

  React.useEffect(() => {
    setSelectedEmail(null);
  }, [activeFolder]);

  const fetchEmails = React.useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL('/api/emails', window.location.origin);
      url.searchParams.set('accountId', selectedAccountId);
      if (searchQuery) url.searchParams.set('query', searchQuery);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.emails) {
        let filtered: EmailRecord[] = data.emails;

        if (activeFolder === 'inbox') {
          filtered = filtered.filter((e) => e.direction === 'inbound');
        } else if (activeFolder === 'sent') {
          filtered = filtered.filter((e) => e.direction === 'outbound');
        } else if (activeFolder === 'spam') {
          filtered = filtered.filter((e) => e.status === 'bounced' || e.status === 'failed' || e.status === 'complained');
        } else if (activeFolder === 'drafts') {
          filtered = filtered.filter((e) => e.isDryRun);
        }

        if (filterStatus !== 'all') {
          filtered = filtered.filter((e) => e.status === filterStatus);
        }

        setEmails(filtered);
      }
    } catch (err) {
      console.error('Error loading emails:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId, activeFolder, filterStatus, searchQuery]);

  React.useEffect(() => {
    fetchEmails();
  }, [fetchEmails, refreshTrigger]);

  const toggleStar = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setStarredIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSelectRow = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSelectAll = () => {
    const nextState = !selectAll;
    setSelectAll(nextState);
    const updated: Record<string, boolean> = {};
    emails.forEach((e) => {
      updated[e.id] = nextState;
    });
    setSelectedIds(updated);
  };

  const getFolderTitle = () => {
    switch (activeFolder) {
      case 'sent':
        return 'Sent';
      case 'spam':
        return 'Spam & Bounced';
      case 'drafts':
        return 'Drafts';
      case 'all':
        return 'All Mail';
      default:
        return 'Inbox';
    }
  };

  const copyEmailId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'opened':
      case 'clicked':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      case 'failed':
      case 'bounced':
        return 'bg-rose-50 text-rose-700 border-rose-200/80';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200/80';
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {selectedEmail ? (
        /* CLEAN UNBOXED EMAIL DETAIL READING VIEW */
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
          {/* Action Toolbar Header */}
          <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSelectedEmail(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center space-x-2 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-slate-700" />
                <span>Back to {getFolderTitle()}</span>
              </button>

              <button
                onClick={() => setIsComposeOpen(true)}
                className="px-4.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-2xs transition-colors cursor-pointer"
              >
                <CornerUpLeft className="w-4 h-4" />
                <span>Reply</span>
              </button>

              <button
                onClick={() => copyEmailId(selectedEmail.resendId || selectedEmail.id)}
                className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs"
              >
                {copiedId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-400" />}
                <span>{copiedId ? 'Copied ID' : 'Copy ID'}</span>
              </button>
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <button
                onClick={() => setActiveTab('rendered')}
                className={`px-4 py-2 rounded-xl font-bold transition-colors ${
                  activeTab === 'rendered' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Visual Render
              </button>
              <button
                onClick={() => setActiveTab('raw')}
                className={`px-4 py-2 rounded-xl font-bold transition-colors ${
                  activeTab === 'raw' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Raw Metadata
              </button>
            </div>
          </div>

          {/* Email Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-8 pt-8 pb-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{selectedEmail.subject}</h1>
                <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded text-xs font-semibold border border-slate-200">
                  {selectedEmail.direction === 'inbound' ? 'Inbound Received' : 'Outbound Sent'}
                </span>
              </div>
              <span className={`px-3.5 py-1 rounded-lg font-bold text-xs border ${getStatusBadge(selectedEmail.status)}`}>
                {selectedEmail.status.toUpperCase()}
              </span>
            </div>

            <div className="px-8 py-4 border-y border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                  {selectedEmail.accountName.charAt(0)}
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm">{selectedEmail.accountName}</span>
                    <span className="text-xs text-slate-500 font-mono font-medium">&lt;{selectedEmail.from}&gt;</span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    to {Array.isArray(selectedEmail.to) ? selectedEmail.to.join(', ') : selectedEmail.to}
                  </div>
                </div>
              </div>

              <div className="text-right space-y-1">
                <div className="text-xs text-slate-500 font-medium">
                  {new Date(selectedEmail.sentAt).toLocaleString()}
                </div>
                <div className="flex items-center justify-end space-x-2">
                  <span className="text-[11px] text-slate-400 font-medium">Profile:</span>
                  <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md font-bold text-xs border border-blue-200/80">
                    {selectedEmail.accountName}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-8 sm:p-10 text-slate-800 text-sm leading-relaxed min-h-[360px]">
              {activeTab === 'rendered' ? (
                selectedEmail.html ? (
                  <div dangerouslySetInnerHTML={{ __html: selectedEmail.html }} />
                ) : (
                  <pre className="whitespace-pre-wrap font-sans text-sm text-slate-800">{selectedEmail.text || 'No message content'}</pre>
                )
              ) : (
                <pre className="bg-slate-900 text-emerald-400 p-8 rounded-2xl text-xs font-mono overflow-x-auto border border-slate-800 shadow-md">
                  {JSON.stringify(selectedEmail, null, 2)}
                </pre>
              )}
            </div>

            <div className="px-8 py-8 border-t border-slate-100 flex items-center space-x-3 bg-white">
              <button
                onClick={() => setIsComposeOpen(true)}
                className="px-6 py-2.5 rounded-full border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center space-x-2 transition-colors cursor-pointer"
              >
                <CornerUpLeft className="w-4 h-4 text-slate-500" />
                <span>Reply</span>
              </button>

              <button
                onClick={() => setIsComposeOpen(true)}
                className="px-6 py-2.5 rounded-full border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center space-x-2 transition-colors cursor-pointer"
              >
                <Share className="w-4 h-4 text-slate-500" />
                <span>Forward</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* SPACIOUS INBOX & SENT TABLE VIEW */
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
          {/* Top Control Bar with Generous Padding */}
          <div className="px-6 py-3.5 border-b border-slate-100 bg-white flex items-center justify-between text-xs shrink-0 select-none">
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleSelectAll}
                className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                title="Select All"
              >
                {selectAll ? (
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-300" />
                )}
              </button>

              <button
                onClick={fetchEmails}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Refresh Folder"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <button className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                <MoreVertical className="w-4 h-4" />
              </button>

              <span className="h-4 w-px bg-slate-200 mx-1" />

              <div className="flex items-center space-x-1.5">
                {['all', 'delivered', 'opened', 'bounced'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-3.5 py-1.5 rounded-full capitalize font-semibold text-xs transition-colors ${
                      filterStatus === st
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-4 text-slate-500 text-xs font-medium">
              <span>
                1–{emails.length} of {emails.length}
              </span>
              <div className="flex items-center space-x-1">
                <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 cursor-not-allowed">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Email Rows List with Generous Row Padding */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                <span>Loading emails...</span>
              </div>
            ) : emails.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <Mail className="w-12 h-12 text-slate-300 mx-auto" />
                <div className="text-sm font-semibold text-slate-700">No messages in {getFolderTitle()}</div>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {activeFolder === 'inbox'
                    ? 'Inbound emails received on your Resend addresses will show up here.'
                    : 'Outbound emails sent via your Resend accounts will show up here.'}
                </p>
              </div>
            ) : (
              emails.map((email) => {
                const isStarred = starredIds[email.id];
                const isSelected = selectedIds[email.id];
                const toDisplay = Array.isArray(email.to) ? email.to.join(', ') : email.to;
                const snippetText = email.text || 'No preview text available';

                return (
                  <div
                    key={email.id}
                    onClick={() => setSelectedEmail(email)}
                    className={`px-6 py-4 transition-colors cursor-pointer flex items-center justify-between text-xs group select-none ${
                      isSelected ? 'bg-blue-50/80' : 'hover:bg-[#f2f6fc]'
                    }`}
                  >
                    {/* Col 1: Controls + Sender Metadata */}
                    <div className="flex items-center space-x-4 w-72 shrink-0">
                      <button
                        onClick={(e) => toggleSelectRow(e, email.id)}
                        className="text-slate-300 hover:text-slate-600 transition-colors cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300" />
                        )}
                      </button>

                      <button
                        onClick={(e) => toggleStar(e, email.id)}
                        className="text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
                      >
                        <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>

                      <div className="min-w-0 truncate">
                        {activeFolder === 'sent' ? (
                          <>
                            <div className="font-semibold text-slate-900 truncate text-xs">
                              To: {toDisplay}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono font-medium truncate leading-tight mt-0.5">
                              from {email.from}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="font-semibold text-slate-900 truncate text-xs">
                              {email.accountName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono font-medium truncate leading-tight mt-0.5">
                              {email.from} → {toDisplay}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Col 2: Subject & Snippet Preview */}
                    <div className="flex-1 px-4 min-w-0 flex items-center truncate">
                      <span className="font-semibold text-slate-900 truncate mr-2">
                        {email.subject}
                      </span>
                      <span className="text-slate-400 font-normal mr-2">—</span>
                      <span className="text-slate-500 font-normal truncate text-xs flex-1">
                        {snippetText}
                      </span>
                    </div>

                    {/* Col 3: Status Badge, Time & Hover Action Toolbar */}
                    <div className="flex items-center space-x-4 shrink-0">
                      {/* Hover Action Icons Bar */}
                      <div className="hidden group-hover:flex items-center space-x-1.5 bg-[#f2f6fc] pr-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            alert(`Archived email ${email.id}`);
                          }}
                          className="p-1.5 hover:bg-slate-200/70 rounded-lg text-slate-600 transition-colors"
                          title="Archive"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            alert(`Deleted email ${email.id}`);
                          }}
                          className="p-1.5 hover:bg-slate-200/70 rounded-lg text-slate-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            alert(`Marked unread ${email.id}`);
                          }}
                          className="p-1.5 hover:bg-slate-200/70 rounded-lg text-slate-600 transition-colors"
                          title="Mark Unread"
                        >
                          <MailOpen className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            alert(`Snoozed ${email.id}`);
                          }}
                          className="p-1.5 hover:bg-slate-200/70 rounded-lg text-slate-600 transition-colors"
                          title="Snooze"
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                      </div>

                      <span className={`px-3 py-0.5 rounded-md font-bold text-[10px] border ${getStatusBadge(email.status)}`}>
                        {email.status.toUpperCase()}
                      </span>

                      <span className="text-xs font-semibold text-slate-500 font-mono w-14 text-right">
                        {new Date(email.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      <ComposeModal isOpen={isComposeOpen} onClose={() => setIsComposeOpen(false)} onSuccess={fetchEmails} />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500 text-xs">Loading Webmail...</div>}>
      <WebmailHome />
    </Suspense>
  );
}
