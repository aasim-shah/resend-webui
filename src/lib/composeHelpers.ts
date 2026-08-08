import { EmailRecord } from '@/lib/types';

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function stripSubjectPrefix(subject: string): string {
  let s = subject.trim();
  const prefixRe = /^(re|fwd?):\s*/i;
  while (prefixRe.test(s)) {
    s = s.replace(prefixRe, '').trim();
  }
  return s;
}

export function buildReplySubject(subject: string): string {
  return `Re: ${stripSubjectPrefix(subject)}`;
}

export function buildForwardSubject(subject: string): string {
  return `Fwd: ${stripSubjectPrefix(subject)}`;
}

function originalBodyHtml(email: EmailRecord): string {
  if (email.html) return email.html;
  if (email.text) return `<p>${escapeHtml(email.text).replace(/\n/g, '<br/>')}</p>`;
  return '<p>(no message content)</p>';
}

/**
 * "Reply" always targets the counterpart of this specific message, not the
 * globally selected profile: for an inbound email that's the sender (or
 * Reply-To, which takes precedence per RFC), for an outbound (Sent) item
 * it's whoever we originally sent it to.
 */
export function replyRecipient(email: EmailRecord): string {
  if (email.direction === 'inbound') {
    return email.replyTo || email.from;
  }
  return Array.isArray(email.to) ? email.to.join(', ') : email.to;
}

export function buildReplyQuote(email: EmailRecord): string {
  const date = new Date(email.sentAt).toLocaleString();
  return `<blockquote style="margin:0 0 0 8px;padding-left:12px;border-left:2px solid #cbd5e1;color:#475569;">On ${date}, ${escapeHtml(
    email.from
  )} wrote:<br/>${originalBodyHtml(email)}</blockquote>`;
}

export function buildForwardQuote(email: EmailRecord): string {
  const to = Array.isArray(email.to) ? email.to.join(', ') : email.to;
  const date = new Date(email.sentAt).toLocaleString();
  return `<p style="color:#64748b;border-top:1px solid #e2e8f0;padding-top:8px;">---------- Forwarded message ----------<br/>From: ${escapeHtml(
    email.from
  )}<br/>Date: ${date}<br/>Subject: ${escapeHtml(email.subject)}<br/>To: ${escapeHtml(to)}</p>${originalBodyHtml(email)}`;
}
