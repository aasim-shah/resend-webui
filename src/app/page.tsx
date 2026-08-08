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
  ChevronDown,
  MoreVertical,
  CheckSquare,
  Square,
} from 'lucide-react';
import { useAccounts } from '@/context/AccountContext';
import { useNotifications } from '@/context/NotificationContext';
import { EmailRecord } from '@/lib/types';
import { ComposeModal, ComposeInitialData } from '@/components/ComposeModal';
import { apiFetch, mapEmail } from '@/lib/api/client';
import { buildForwardQuote, buildForwardSubject, buildReplyQuote, buildReplySubject, replyRecipient, stripSubjectPrefix } from '@/lib/composeHelpers';
import { groupIntoThreads, EmailThread } from '@/lib/threading';

function matchesFolder(email: EmailRecord, folder: string): boolean {
  switch (folder) {
    case 'inbox':
      return email.direction === 'inbound';
    case 'sent':
      return email.direction === 'outbound';
    case 'spam':
      return email.status === 'bounced' || email.status === 'failed' || email.status === 'complained';
    case 'drafts':
      return Boolean(email.isDryRun);
    default:
      return true;
  }
}

function WebmailHome() {
  const { accounts, selectedAccountId, activeFolder, searchQuery, refreshTrigger } = useAccounts();
  const { refresh: refreshNotifications } = useNotifications();

  const [emails, setEmails] = React.useState<EmailRecord[]>([]);
  const [selectedThreadKey, setSelectedThreadKey] = React.useState<string | null>(null);
  const [filterStatus, setFilterStatus] = React.useState<string>('all');
  const [starredIds, setStarredIds] = React.useState<Record<string, boolean>>({});
  const [selectedIds, setSelectedIds] = React.useState<Record<string, boolean>>({});
  const [selectAll, setSelectAll] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [composeContext, setComposeContext] = React.useState<{ mode: 'reply' | 'forward'; email: EmailRecord } | null>(null);
  const [activeTab, setActiveTab] = React.useState<'rendered' | 'raw'>('rendered');
  const [copiedId, setCopiedId] = React.useState<boolean>(false);
  // Ids toggled away from their default expand/collapse state within a thread
  // (default: only the latest message in a thread starts expanded).
  const [toggledMessageIds, setToggledMessageIds] = React.useState<Record<string, boolean>>({});

  const openReply = (email: EmailRecord) => setComposeContext({ mode: 'reply', email });
  const openForward = (email: EmailRecord) => setComposeContext({ mode: 'forward', email });
  const closeCompose = () => setComposeContext(null);

  const composeInitialData: ComposeInitialData | undefined = composeContext
    ? {
        mode: composeContext.mode,
        accountId: composeContext.email.accountId,
        // Forward intentionally leaves "to" blank — you're sending to someone new,
        // not continuing the conversation with the original counterpart.
        to: composeContext.mode === 'reply' ? replyRecipient(composeContext.email) : '',
        subject:
          composeContext.mode === 'reply'
            ? buildReplySubject(composeContext.email.subject)
            : buildForwardSubject(composeContext.email.subject),
        quotedHtml:
          composeContext.mode === 'reply'
            ? buildReplyQuote(composeContext.email)
            : buildForwardQuote(composeContext.email),
      }
    : undefined;

  React.useEffect(() => {
    setSelectedThreadKey(null);
  }, [activeFolder]);

  const fetchEmails = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedAccountId && selectedAccountId !== 'all') params.set('profileId', selectedAccountId);
      if (searchQuery) params.set('query', searchQuery);
      // High enough that a whole conversation thread never gets split across pages.
      params.set('limit', '500');

      const res = await apiFetch(`/api/emails?${params.toString()}`);
      const data = await res.json();
      if (data.emails) {
        // Kept unfiltered by folder/status here — folder & status only decide which
        // threads surface in the row list (see visibleThreads below). A thread opened
        // from any folder still shows its full cross-folder conversation.
        setEmails(data.emails.map(mapEmail));
      }
    } catch (err) {
      console.error('Error loading emails:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId, searchQuery]);

  React.useEffect(() => {
    fetchEmails();
  }, [fetchEmails, refreshTrigger]);

  const allThreads = React.useMemo(() => groupIntoThreads(emails), [emails]);
  const selectedThread = React.useMemo(
    () => (selectedThreadKey ? allThreads.find((t) => t.key === selectedThreadKey) ?? null : null),
    [allThreads, selectedThreadKey]
  );

  /**
   * The row list only surfaces threads that have at least one message matching the
   * active folder/status filters, and its summary (sender, snippet, status, time)
   * reflects the latest matching message — not necessarily the thread's true latest
   * message, which may live in a different folder (e.g. a newer inbound reply while
   * viewing Sent).
   */
  const visibleThreads = React.useMemo(() => {
    return allThreads
      .map((thread) => {
        const rowMessages = thread.messages.filter(
          (m) => matchesFolder(m, activeFolder) && (filterStatus === 'all' || m.status === filterStatus)
        );
        return rowMessages.length > 0 ? { ...thread, rowMessages } : null;
      })
      .filter((t): t is EmailThread & { rowMessages: EmailRecord[] } => t !== null)
      .sort((a, b) => {
        const aLatest = a.rowMessages[a.rowMessages.length - 1];
        const bLatest = b.rowMessages[b.rowMessages.length - 1];
        return new Date(bLatest.sentAt).getTime() - new Date(aLatest.sentAt).getTime();
      });
  }, [allThreads, activeFolder, filterStatus]);

  const markRead = React.useCallback(
    async (email: EmailRecord) => {
      if (email.isRead) return;
      setEmails((prev) => prev.map((e) => (e.id === email.id ? { ...e, isRead: true } : e)));
      try {
        await apiFetch(`/api/emails/${email.id}/read`, { method: 'PATCH' });
        refreshNotifications();
      } catch (err) {
        console.error('Failed to mark email read:', err);
      }
    },
    [refreshNotifications]
  );

  const markUnread = React.useCallback(
    async (e: React.MouseEvent, email: EmailRecord) => {
      e.stopPropagation();
      setEmails((prev) => prev.map((it) => (it.id === email.id ? { ...it, isRead: false } : it)));
      try {
        await apiFetch(`/api/emails/${email.id}/unread`, { method: 'PATCH' });
        refreshNotifications();
      } catch (err) {
        console.error('Failed to mark email unread:', err);
      }
    },
    [refreshNotifications]
  );

  const openThread = (thread: EmailThread) => {
    setSelectedThreadKey(thread.key);
    thread.messages.filter((m) => m.direction === 'inbound' && m.isRead === false).forEach(markRead);
  };

  const toggleStar = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    setStarredIds((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSelectRow = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    setSelectedIds((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSelectAll = () => {
    const nextState = !selectAll;
    setSelectAll(nextState);
    const updated: Record<string, boolean> = {};
    visibleThreads.forEach((t) => {
      updated[t.key] = nextState;
    });
    setSelectedIds(updated);
  };

  const isMessageExpanded = (message: EmailRecord, isLatest: boolean) => {
    const toggled = toggledMessageIds[message.id];
    return toggled === undefined ? isLatest : toggled;
  };

  const toggleMessageExpanded = (message: EmailRecord, isLatest: boolean) => {
    setToggledMessageIds((prev) => ({ ...prev, [message.id]: !isMessageExpanded(message, isLatest) }));
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
      {selectedThread ? (
        (() => {
          const messages = selectedThread.messages;
          const latest = messages[messages.length - 1];
          const threadSubject = stripSubjectPrefix(messages[0].subject);

          return (
            /* CLEAN UNBOXED EMAIL DETAIL READING VIEW */
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
              {/* Action Toolbar Header */}
              <div className="px-4 sm:px-8 py-3 sm:py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 shrink-0 bg-white">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedThreadKey(null)}
                    className="px-3 sm:px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center space-x-2 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4 text-slate-700" />
                    <span className="hidden sm:inline">Back to {getFolderTitle()}</span>
                    <span className="sm:hidden">Back</span>
                  </button>

                  <button
                    onClick={() => openReply(latest)}
                    className="px-3.5 sm:px-4.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-2xs transition-colors cursor-pointer"
                  >
                    <CornerUpLeft className="w-4 h-4" />
                    <span>Reply</span>
                  </button>

                  <button
                    onClick={() => copyEmailId(latest.resendId || latest.id)}
                    className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs"
                  >
                    {copiedId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-400" />}
                    <span className="hidden sm:inline">{copiedId ? 'Copied ID' : 'Copy ID'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => setActiveTab('rendered')}
                    className={`px-3 sm:px-4 py-2 rounded-xl font-bold transition-colors ${
                      activeTab === 'rendered' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Visual Render
                  </button>
                  <button
                    onClick={() => setActiveTab('raw')}
                    className={`px-3 sm:px-4 py-2 rounded-xl font-bold transition-colors ${
                      activeTab === 'raw' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Raw Metadata
                  </button>
                </div>
              </div>

              {/* Thread Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="px-4 sm:px-8 pt-6 sm:pt-8 pb-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3 flex-wrap min-w-0">
                    <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight break-words">{threadSubject}</h1>
                    <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded text-xs font-semibold border border-slate-200 shrink-0">
                      {messages.length > 1 ? `${messages.length} messages` : getFolderTitle()}
                    </span>
                  </div>
                  <span className={`px-3.5 py-1 rounded-lg font-bold text-xs border shrink-0 ${getStatusBadge(latest.status)}`}>
                    {latest.status.toUpperCase()}
                  </span>
                </div>

                {activeTab === 'raw' ? (
                  <div className="p-4 sm:p-8">
                    <pre className="bg-slate-900 text-emerald-400 p-4 sm:p-8 rounded-2xl text-xs font-mono overflow-x-auto border border-slate-800 shadow-md">
                      {JSON.stringify(messages, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {messages.map((m) => {
                      const isLatest = m.id === latest.id;
                      const expanded = isMessageExpanded(m, isLatest);
                      const toDisplay = Array.isArray(m.to) ? m.to.join(', ') : m.to;
                      const senderLabel = m.direction === 'inbound' ? m.from : m.accountName;

                      if (!expanded) {
                        return (
                          <button
                            key={m.id}
                            onClick={() => toggleMessageExpanded(m, isLatest)}
                            className="w-full text-left px-4 sm:px-8 py-3.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/70 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                                {senderLabel.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-semibold text-slate-800 shrink-0 hidden sm:inline">{senderLabel}</span>
                              <span className="text-slate-400 truncate">{m.text || 'No preview text available'}</span>
                            </div>
                            <span className="text-slate-400 font-medium shrink-0 text-[11px] sm:text-xs">
                              {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </button>
                        );
                      }

                      return (
                        <div key={m.id}>
                          <div
                            onClick={() => messages.length > 1 && toggleMessageExpanded(m, isLatest)}
                            className={`px-4 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white ${
                              messages.length > 1 ? 'cursor-pointer' : ''
                            }`}
                          >
                            <div className="flex items-center space-x-4 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                                {senderLabel.charAt(0).toUpperCase()}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center flex-wrap gap-x-2">
                                  <span className="font-bold text-slate-900 text-sm">{senderLabel}</span>
                                  <span className="text-xs text-slate-500 font-mono font-medium truncate">&lt;{m.from}&gt;</span>
                                </div>
                                <div className="text-xs text-slate-500 font-mono mt-0.5 truncate">to {toDisplay}</div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0 pl-14 sm:pl-0">
                              <div className="text-left sm:text-right space-y-1">
                                <div className="text-xs text-slate-500 font-medium">
                                  {new Date(m.sentAt).toLocaleString()}
                                </div>
                                <div className="flex items-center sm:justify-end space-x-2">
                                  <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Profile:</span>
                                  <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md font-bold text-xs border border-blue-200/80">
                                    {m.accountName}
                                  </span>
                                </div>
                              </div>
                              {messages.length > 1 && <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                            </div>
                          </div>

                          <div className="px-4 sm:px-10 pb-8 text-slate-800 text-sm leading-relaxed overflow-x-auto">
                            {m.html ? (
                              <div dangerouslySetInnerHTML={{ __html: m.html }} />
                            ) : (
                              <pre className="whitespace-pre-wrap font-sans text-sm text-slate-800">{m.text || 'No message content'}</pre>
                            )}
                          </div>

                          <div className="px-4 sm:px-8 pb-6 flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openReply(m);
                              }}
                              className="px-4 py-1.5 rounded-full border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-[11px] flex items-center space-x-1.5 transition-colors cursor-pointer"
                            >
                              <CornerUpLeft className="w-3.5 h-3.5 text-slate-500" />
                              <span>Reply</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openForward(m);
                              }}
                              className="px-4 py-1.5 rounded-full border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-[11px] flex items-center space-x-1.5 transition-colors cursor-pointer"
                            >
                              <Share className="w-3.5 h-3.5 text-slate-500" />
                              <span>Forward</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="px-4 sm:px-8 py-6 sm:py-8 border-t border-slate-100 flex items-center space-x-3 bg-white">
                  <button
                    onClick={() => openReply(latest)}
                    className="px-6 py-2.5 rounded-full border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center space-x-2 transition-colors cursor-pointer"
                  >
                    <CornerUpLeft className="w-4 h-4 text-slate-500" />
                    <span>Reply</span>
                  </button>

                  <button
                    onClick={() => openForward(latest)}
                    className="px-6 py-2.5 rounded-full border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center space-x-2 transition-colors cursor-pointer"
                  >
                    <Share className="w-4 h-4 text-slate-500" />
                    <span>Forward</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })()
      ) : (
        /* SPACIOUS INBOX & SENT TABLE VIEW */
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
          {/* Top Control Bar with Generous Padding */}
          <div className="px-3 sm:px-6 py-2.5 sm:py-3.5 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-2 text-xs shrink-0 select-none">
            <div className="flex items-center gap-1 sm:gap-4 flex-wrap">
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

              <button className="hidden sm:inline-flex p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                <MoreVertical className="w-4 h-4" />
              </button>

              <span className="hidden sm:block h-4 w-px bg-slate-200 mx-1" />

              <div className="flex items-center gap-1.5 flex-wrap">
                {['all', 'delivered', 'opened', 'bounced'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full capitalize font-semibold text-xs transition-colors ${
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

            <div className="flex items-center space-x-3 sm:space-x-4 text-slate-500 text-xs font-medium">
              <span className="hidden sm:inline">
                1–{visibleThreads.length} of {visibleThreads.length}
              </span>
              <span className="sm:hidden">{visibleThreads.length}</span>
              <div className="hidden sm:flex items-center space-x-1">
                <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 cursor-not-allowed">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Thread Rows List with Generous Row Padding */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                <span>Loading emails...</span>
              </div>
            ) : visibleThreads.length === 0 ? (
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
              visibleThreads.map((thread) => {
                const latest = thread.rowMessages[thread.rowMessages.length - 1];
                const isStarred = starredIds[thread.key];
                const isSelected = selectedIds[thread.key];
                const isUnread = thread.messages.some((m) => m.direction === 'inbound' && m.isRead === false);
                const toDisplay = Array.isArray(latest.to) ? latest.to.join(', ') : latest.to;
                const snippetText = latest.text || 'No preview text available';
                const threadSubject = stripSubjectPrefix(thread.messages[0].subject);

                return (
                  <div
                    key={thread.key}
                    onClick={() => openThread(thread)}
                    className={`px-3 sm:px-6 py-3 sm:py-4 transition-colors cursor-pointer flex items-start sm:items-center gap-3 sm:justify-between text-xs group select-none ${
                      isSelected ? 'bg-blue-50/80' : 'hover:bg-[#f2f6fc]'
                    }`}
                  >
                    {/* Col 1: Controls + Sender Metadata (desktop) */}
                    <div className="hidden sm:flex items-center space-x-4 w-72 shrink-0">
                      <button
                        onClick={(e) => toggleSelectRow(e, thread.key)}
                        className="text-slate-300 hover:text-slate-600 transition-colors cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300" />
                        )}
                      </button>

                      <button
                        onClick={(e) => toggleStar(e, thread.key)}
                        className="text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
                      >
                        <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>

                      {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" title="Unread" />}

                      <div className="min-w-0 truncate">
                        {activeFolder === 'sent' ? (
                          <>
                            <div className={`truncate text-xs ${isUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-900'}`}>
                              To: {toDisplay}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono font-medium truncate leading-tight mt-0.5">
                              from {latest.from}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className={`truncate text-xs ${isUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-900'}`}>
                              {latest.accountName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono font-medium truncate leading-tight mt-0.5">
                              {latest.from} → {toDisplay}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Mobile unread indicator */}
                    <span
                      className={`sm:hidden mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${isUnread ? 'bg-blue-600' : 'bg-transparent'}`}
                      title={isUnread ? 'Unread' : undefined}
                    />

                    {/* Col 2: Subject & Snippet Preview (+ mobile sender/time/status) */}
                    <div className="flex-1 sm:px-4 min-w-0">
                      <div className="flex sm:hidden items-center justify-between gap-2 mb-0.5">
                        <span className={`truncate text-xs ${isUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-900'}`}>
                          {activeFolder === 'sent' ? `To: ${toDisplay}` : latest.accountName}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono shrink-0">
                          {new Date(latest.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex items-center min-w-0">
                        <span className={`truncate mr-2 ${isUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-900'}`}>
                          {threadSubject}
                        </span>
                        {thread.messages.length > 1 && (
                          <span className="text-slate-400 font-semibold mr-2 shrink-0">({thread.messages.length})</span>
                        )}
                        <span className="text-slate-400 font-normal mr-2 hidden sm:inline">—</span>
                        <span className="text-slate-500 font-normal truncate text-xs flex-1">
                          {snippetText}
                        </span>
                      </div>

                      <div className="sm:hidden mt-1.5">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${getStatusBadge(latest.status)}`}>
                          {latest.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Col 3: Status Badge, Time & Hover Action Toolbar (desktop) */}
                    <div className="hidden sm:flex items-center space-x-4 shrink-0">
                      {/* Hover Action Icons Bar */}
                      <div className="hidden group-hover:flex items-center space-x-1.5 bg-[#f2f6fc] pr-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            alert(`Archived thread ${thread.key}`);
                          }}
                          className="p-1.5 hover:bg-slate-200/70 rounded-lg text-slate-600 transition-colors"
                          title="Archive"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            alert(`Deleted thread ${thread.key}`);
                          }}
                          className="p-1.5 hover:bg-slate-200/70 rounded-lg text-slate-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => markUnread(e, latest)}
                          className="p-1.5 hover:bg-slate-200/70 rounded-lg text-slate-600 transition-colors"
                          title="Mark Unread"
                        >
                          <MailOpen className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            alert(`Snoozed ${thread.key}`);
                          }}
                          className="p-1.5 hover:bg-slate-200/70 rounded-lg text-slate-600 transition-colors"
                          title="Snooze"
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                      </div>

                      <span className={`px-3 py-0.5 rounded-md font-bold text-[10px] border ${getStatusBadge(latest.status)}`}>
                        {latest.status.toUpperCase()}
                      </span>

                      <span className="text-xs font-semibold text-slate-500 font-mono w-14 text-right">
                        {new Date(latest.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      <ComposeModal
        key={composeContext ? `${composeContext.mode}-${composeContext.email.id}` : 'new'}
        isOpen={composeContext !== null}
        onClose={closeCompose}
        onSuccess={fetchEmails}
        initialData={composeInitialData}
      />
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
