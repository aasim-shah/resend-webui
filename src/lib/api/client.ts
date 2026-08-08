import { DomainRecord, EmailRecord, ResendAccount } from '@/lib/types';

// Routed through the /api-proxy rewrite in next.config.mjs rather than calling the
// backend's absolute URL directly, so the browser sees this origin (not a cross-site
// one) and the auth cookie is treated as first-party. See next.config.mjs for why.
export const API_BASE = '/api-proxy';

/**
 * `credentials: 'include'` keeps the httpOnly session cookie flowing on every call;
 * harmless no-op for same-origin requests, needed for direct cross-origin use (e.g.
 * hitting the backend straight from localhost:3000 in dev without the proxy).
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers: HeadersInit = { ...(init.headers || {}) };
  if (init.body && !('Content-Type' in headers)) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  }

  return fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers,
  });
}

interface BackendProfile {
  id: string;
  name: string;
  fromName?: string;
  fromEmail: string;
  domain?: string;
  isDefault: boolean;
  apiKeyMasked?: string;
  webhookSecretMasked?: string;
  hasWebhookSecret?: boolean;
  createdAt: string;
  updatedAt: string;
}

export function mapProfileToAccount(p: BackendProfile): ResendAccount {
  return {
    id: p.id,
    name: p.name,
    fromName: p.fromName,
    fromEmail: p.fromEmail,
    domain: p.domain,
    isDefault: p.isDefault,
    apiKeyMasked: p.apiKeyMasked,
    webhookSecretMasked: p.webhookSecretMasked,
    hasWebhookSecret: p.hasWebhookSecret,
    source: 'custom',
    createdAt: p.createdAt,
  };
}

interface BackendEmail {
  id: string;
  resendId?: string;
  profileId: string;
  profileName?: string;
  from: string;
  to: string | string[];
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  subject: string;
  html?: string;
  text?: string;
  status: EmailRecord['status'];
  direction?: EmailRecord['direction'];
  isDryRun?: boolean;
  isRead?: boolean;
  tags?: Array<{ name: string; value: string }>;
  error?: string;
  sentAt: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  bouncedAt?: string;
}

export function mapEmail(e: BackendEmail): EmailRecord {
  return {
    id: e.id,
    resendId: e.resendId,
    accountId: e.profileId,
    accountName: e.profileName || 'Unknown Profile',
    from: e.from,
    to: e.to,
    cc: e.cc,
    bcc: e.bcc,
    replyTo: e.replyTo,
    subject: e.subject,
    html: e.html,
    text: e.text,
    status: e.status,
    sentAt: e.sentAt,
    deliveredAt: e.deliveredAt,
    openedAt: e.openedAt,
    clickedAt: e.clickedAt,
    bouncedAt: e.bouncedAt,
    isDryRun: e.isDryRun,
    isRead: e.isRead,
    direction: e.direction,
    tags: e.tags,
    error: e.error,
  };
}

interface BackendDomain {
  id: string;
  name: string;
  status: string;
  region?: string;
  createdAt?: string;
  profileId: string;
  profileName: string;
}

export function mapDomain(d: BackendDomain): DomainRecord {
  return {
    id: d.id,
    name: d.name,
    status: d.status,
    region: d.region,
    createdAt: d.createdAt || new Date().toISOString(),
    accountId: d.profileId,
    accountName: d.profileName,
  };
}
