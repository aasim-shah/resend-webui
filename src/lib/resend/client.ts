import { Resend } from 'resend';
import { getAccountById, getAllAccounts } from './accounts';
import { SendEmailPayload, EmailRecord, DomainRecord } from '../types';
import { saveEmailRecord } from '../db/store';

export function getResendClient(accountId: string): { client: Resend; account: ReturnType<typeof getAccountById> } {
  const account = getAccountById(accountId);
  if (!account) {
    throw new Error(`Account not found for ID: ${accountId}`);
  }
  return {
    client: new Resend(account.apiKey),
    account,
  };
}

export async function sendEmailViaAccount(payload: SendEmailPayload): Promise<EmailRecord> {
  const { accountId, to, cc, bcc, replyTo, subject, html, text, isDryRun, tags } = payload;
  const account = getAccountById(accountId);

  if (!account) {
    throw new Error(`Invalid account ID: ${accountId}`);
  }

  const fromSender = account.fromName ? `"${account.fromName}" <${account.fromEmail}>` : account.fromEmail;
  const now = new Date().toISOString();
  const id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  if (isDryRun) {
    const dryRunRecord: EmailRecord = {
      id,
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
      tags,
    };
    saveEmailRecord(dryRunRecord);
    return dryRunRecord;
  }

  try {
    const { client } = getResendClient(accountId);
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
        accountId: account.id,
        accountName: account.name,
        from: fromSender,
        to,
        subject,
        html,
        text,
        status: 'failed',
        sentAt: now,
        error: response.error.message || JSON.stringify(response.error),
      };
      saveEmailRecord(errorRecord);
      throw new Error(response.error.message);
    }

    const successRecord: EmailRecord = {
      id,
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
      tags,
    };
    saveEmailRecord(successRecord);
    return successRecord;
  } catch (err: any) {
    const errorRecord: EmailRecord = {
      id,
      accountId: account.id,
      accountName: account.name,
      from: fromSender,
      to,
      subject,
      html,
      text,
      status: 'failed',
      sentAt: now,
      error: err.message || String(err),
    };
    saveEmailRecord(errorRecord);
    throw err;
  }
}

export async function fetchDomainsForAccount(accountId: string): Promise<DomainRecord[]> {
  try {
    const { client, account } = getResendClient(accountId);
    const response = await client.domains.list();
    if (response.error || !response.data) {
      console.warn(`Could not fetch domains for account ${accountId}:`, response.error);
      return [];
    }

    // Process list items
    const domainsList: DomainRecord[] = [];
    for (const d of response.data.data) {
      domainsList.push({
        id: d.id,
        accountId: account!.id,
        accountName: account!.name,
        name: d.name,
        status: d.status,
        createdAt: d.created_at,
        region: d.region,
      });
    }
    return domainsList;
  } catch (error) {
    console.error(`Error fetching domains for account ${accountId}:`, error);
    return [];
  }
}

export async function fetchAllDomains(): Promise<DomainRecord[]> {
  const accounts = getAllAccounts();
  const allDomains: DomainRecord[] = [];
  for (const acc of accounts) {
    const domains = await fetchDomainsForAccount(acc.id);
    allDomains.push(...domains);
  }
  return allDomains;
}
