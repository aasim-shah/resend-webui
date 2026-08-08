import { EmailRecord } from '@/lib/types';
import { stripSubjectPrefix } from '@/lib/composeHelpers';

function normalizeThreadSubject(subject: string): string {
  return stripSubjectPrefix(subject).toLowerCase();
}

function extractEmailAddress(raw: string): string {
  const match = raw.match(/<([^>]+)>/);
  const address = (match ? match[1] : raw).trim();
  return address.split(',')[0].trim().toLowerCase();
}

function counterpartAddress(email: EmailRecord): string {
  if (email.direction === 'inbound') return extractEmailAddress(email.from);
  const to = Array.isArray(email.to) ? email.to[0] : email.to;
  return extractEmailAddress(to || '');
}

/**
 * There's no Message-ID/In-Reply-To chain to key off (Resend doesn't expose the
 * real outbound RFC822 Message-ID), so threads are grouped the way most simple
 * webmail clients bootstrap threading: same account + same counterpart address +
 * same subject once "Re:"/"Fwd:" prefixes are stripped.
 */
export function getThreadKey(email: EmailRecord): string {
  return `${email.accountId}::${counterpartAddress(email)}::${normalizeThreadSubject(email.subject)}`;
}

export interface EmailThread {
  key: string;
  /** Chronological ascending — oldest first, latest last. */
  messages: EmailRecord[];
}

export function groupIntoThreads(emails: EmailRecord[]): EmailThread[] {
  const byKey = new Map<string, EmailRecord[]>();
  for (const email of emails) {
    const key = getThreadKey(email);
    const list = byKey.get(key);
    if (list) list.push(email);
    else byKey.set(key, [email]);
  }

  const threads: EmailThread[] = Array.from(byKey.entries()).map(([key, messages]) => ({
    key,
    messages: [...messages].sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()),
  }));

  threads.sort((a, b) => {
    const aLatest = a.messages[a.messages.length - 1];
    const bLatest = b.messages[b.messages.length - 1];
    return new Date(bLatest.sentAt).getTime() - new Date(aLatest.sentAt).getTime();
  });

  return threads;
}
