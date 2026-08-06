import { Resend } from 'resend';
import { getAccountById, getAllAccounts } from './accounts';
import { SendEmailPayload, EmailRecord, DomainRecord } from '../types';
import { saveEmailRecord } from '../db/store';

export function getResendClient(accountId: string, userId?: string): { client: Resend; account: ReturnType<typeof getAccountById> } {
  const account = getAccountById(accountId, userId);
  if (!account) {
    throw new Error(`Account not found for ID: ${accountId}`);
  }
  return {
    client: new Resend(account.apiKey),
    account,
  };
}

export async function sendEmailViaAccount(payload: SendEmailPayload): Promise<EmailRecord> {
  const { accountId, userId, to, cc, bcc, replyTo, subject, html, text, isDryRun, tags } = payload;
  const account = getAccountById(accountId, userId);

  if (!account) {
    throw new Error(`Invalid account ID: ${accountId}`);
  }

  const fromSender = account.fromName ? `"${account.fromName}" <${account.fromEmail}>` : account.fromEmail;
  const now = new Date().toISOString();
  const id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  if (isDryRun) {
    const dryRunRecord: EmailRecord = {
      id,
      userId,
      resendId: `dryrun_${id}`,
      accountId: account.id,
      accountName: account.name,
      from: fromSender,
      to,
      cc,
      bcc,
      replyTo,
      subject: `[DRY-RUN] ${subject}`,
      html,
      text,
      status: 'sent',
      sentAt: now,
      isDryRun: true,
      direction: 'outbound',
      tags,
    };
    saveEmailRecord(dryRunRecord);
    return dryRunRecord;
  }

  try {
    const { client } = getResendClient(accountId, userId);
    const response = await client.emails.send({
      from: fromSender,
      to: Array.isArray(to) ? to : [to],
      cc: cc ? (Array.isArray(cc) ? cc : [cc]) : undefined,
      bcc: bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined,
      replyTo: replyTo || undefined,
      subject,
      html: html || (text ? `<p>${text}</p>` : ''),
      text,
      tags: tags || undefined,
    });

    if (response.error) {
      const errorRecord: EmailRecord = {
        id,
        userId,
        accountId: account.id,
        accountName: account.name,
        from: fromSender,
        to,
        subject,
        html,
        text,
        status: 'failed',
        sentAt: now,
        direction: 'outbound',
        error: response.error.message || JSON.stringify(response.error),
      };
      saveEmailRecord(errorRecord);
      throw new Error(response.error.message);
    }

    const successRecord: EmailRecord = {
      id,
      userId,
      resendId: response.data?.id,
      accountId: account.id,
      accountName: account.name,
      from: fromSender,
      to,
      cc,
      bcc,
      replyTo,
      subject,
      html,
      text,
      status: 'sent',
      sentAt: now,
      direction: 'outbound',
      tags,
    };
    saveEmailRecord(successRecord);
    return successRecord;
  } catch (err: any) {
    const errorRecord: EmailRecord = {
      id,
      userId,
      accountId: account.id,
      accountName: account.name,
      from: fromSender,
      to,
      subject,
      html,
      text,
      status: 'failed',
      sentAt: now,
      direction: 'outbound',
      error: err.message || 'Unknown error occurred',
    };
    saveEmailRecord(errorRecord);
    throw err;
  }
}

export async function fetchDomainsForAccount(accountId: string, userId?: string): Promise<DomainRecord[]> {
  try {
    const { client, account } = getResendClient(accountId, userId);
    if (!account) return [];
    const response = await client.domains.list();
    if (response.data?.data) {
      return response.data.data.map((d: any) => ({
        id: d.id,
        name: d.name,
        status: d.status,
        createdAt: d.created_at,
        region: d.region,
        accountId: account.id,
        accountName: account.name,
      }));
    }
    return [];
  } catch (e) {
    return [];
  }
}

export async function fetchAllDomains(userId?: string): Promise<DomainRecord[]> {
  const accounts = getAllAccounts(userId);
  const results = await Promise.all(accounts.map((a) => fetchDomainsForAccount(a.id, userId)));
  return results.flat();
}
