export interface User {
  id: string;
  email: string;
  name: string;
  password?: string;
  createdAt: string;
}

export interface ResendAccount {
  id: string;
  userId?: string;
  name: string;
  fromName?: string;
  apiKey: string;
  apiKeyMasked?: string;
  fromEmail: string;
  domain?: string;
  isDefault?: boolean;
  source: 'env' | 'env.corebyte' | 'env.feedwink' | 'custom';
  createdAt?: string;
}

export interface EmailRecord {
  id: string;
  resendId?: string;
  userId?: string;
  accountId: string;
  accountName: string;
  from: string;
  to: string | string[];
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  subject: string;
  html?: string;
  text?: string;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed' | 'complained';
  sentAt: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  bouncedAt?: string;
  isDryRun?: boolean;
  direction?: 'inbound' | 'outbound';
  tags?: Array<{ name: string; value: string }>;
  error?: string;
}

export interface SendEmailPayload {
  accountId: string;
  to: string | string[];
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  subject: string;
  html?: string;
  text?: string;
  isDryRun?: boolean;
  tags?: Array<{ name: string; value: string }>;
}

export interface DomainRecord {
  id: string;
  userId?: string;
  name: string;
  accountId?: string;
  accountName?: string;
  region?: string;
  status: 'verified' | 'pending' | 'failed' | 'active' | 'not_started' | 'partially_failed' | string;
  records?: Array<{
    type: string;
    name: string;
    value: string;
    status: 'valid' | 'invalid' | 'not_started' | string;
  }>;
  createdAt: string;
}

export interface WebhookEventRecord {
  id: string;
  type: string;
  createdAt: string;
  data: any;
}
