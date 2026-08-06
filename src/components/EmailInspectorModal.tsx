'use client';

import React from 'react';
import { EmailRecord } from '@/lib/types';
import { X, CheckCircle2, Clock, AlertTriangle, Mail } from 'lucide-react';

interface EmailInspectorModalProps {
  email: EmailRecord | null;
  onClose: () => void;
}

export function EmailInspectorModal({ email, onClose }: EmailInspectorModalProps) {
  const [activeTab, setActiveTab] = React.useState<'preview' | 'html' | 'raw'>('preview');

  if (!email) return null;

  const toList = Array.isArray(email.to) ? email.to.join(', ') : email.to;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'opened':
      case 'clicked':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            {status.toUpperCase()}
          </span>
        );
      case 'failed':
      case 'bounced':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
            {status.toUpperCase()}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3.5 h-3.5 mr-1" />
            {status.toUpperCase()}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm truncate max-w-lg">{email.subject}</h2>
              <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                <span>Profile: <strong className="text-slate-800 font-semibold">{email.accountName}</strong></span>
                <span>•</span>
                <span>ID: {email.resendId || email.id}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {email.isDryRun && (
              <span className="bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-md border border-amber-200 font-semibold">
                Dry Run
              </span>
            )}
            {getStatusBadge(email.status)}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Metadata Details Grid */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-200 grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="text-slate-500 font-medium">From Address</div>
            <div className="text-slate-900 font-mono font-semibold mt-0.5">{email.from}</div>
          </div>
          <div>
            <div className="text-slate-500 font-medium">To Recipient</div>
            <div className="text-slate-900 font-mono font-semibold mt-0.5">{toList}</div>
          </div>
          <div>
            <div className="text-slate-500 font-medium">Sent Timestamp</div>
            <div className="text-slate-800 font-medium mt-0.5">{new Date(email.sentAt).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-slate-500 font-medium">Event Activity</div>
            <div className="text-slate-800 mt-0.5 flex items-center space-x-2 text-[11px]">
              {email.deliveredAt && <span className="text-emerald-700 font-medium">Delivered: {new Date(email.deliveredAt).toLocaleTimeString()}</span>}
              {email.openedAt && <span className="text-blue-700 font-medium">Opened: {new Date(email.openedAt).toLocaleTimeString()}</span>}
              {!email.deliveredAt && !email.openedAt && <span className="text-slate-400">No telemetry events logged</span>}
            </div>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center justify-between px-5 bg-white border-b border-slate-200 text-xs">
          <div className="flex space-x-2 py-2">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors ${
                activeTab === 'preview' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Visual Render
            </button>
            <button
              onClick={() => setActiveTab('html')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors ${
                activeTab === 'html' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              HTML Code
            </button>
            <button
              onClick={() => setActiveTab('raw')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors ${
                activeTab === 'raw' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Raw Payload
            </button>
          </div>
        </div>

        {/* Content Pane */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 min-h-[300px]">
          {activeTab === 'preview' && (
            <div className="bg-white border border-slate-200/80 rounded-xl p-6 text-slate-800 shadow-2xs min-h-[250px]">
              {email.html ? (
                <div dangerouslySetInnerHTML={{ __html: email.html }} />
              ) : (
                <pre className="whitespace-pre-wrap font-sans text-sm">{email.text || 'No message body'}</pre>
              )}
            </div>
          )}

          {activeTab === 'html' && (
            <pre className="bg-slate-900 p-5 rounded-xl text-xs font-mono text-blue-300 overflow-x-auto border border-slate-800 shadow-md">
              {email.html || email.text || 'No content'}
            </pre>
          )}

          {activeTab === 'raw' && (
            <pre className="bg-slate-900 p-5 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto border border-slate-800 shadow-md">
              {JSON.stringify(email, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
