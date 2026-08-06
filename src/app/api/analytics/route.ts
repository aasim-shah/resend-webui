import { NextResponse } from 'next/server';
import { getEmailRecords } from '@/lib/db/store';
import { getAllAccounts } from '@/lib/resend/accounts';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId') || 'all';

  const accounts = getAllAccounts();
  const emails = getEmailRecords(accountId);

  const totalSent = emails.length;
  const delivered = emails.filter((e) => e.status === 'delivered' || e.status === 'opened' || e.status === 'clicked').length;
  const opened = emails.filter((e) => e.status === 'opened' || e.status === 'clicked').length;
  const clicked = emails.filter((e) => e.status === 'clicked').length;
  const bounced = emails.filter((e) => e.status === 'bounced' || e.status === 'failed').length;

  const deliveryRate = totalSent > 0 ? Math.round((delivered / totalSent) * 100) : 100;
  const openRate = delivered > 0 ? Math.round((opened / delivered) * 100) : 0;
  const clickRate = opened > 0 ? Math.round((clicked / opened) * 100) : 0;

  // Breakdown by account
  const accountBreakdown = accounts.map((acc) => {
    const accEmails = getEmailRecords(acc.id);
    const accSent = accEmails.length;
    const accOpened = accEmails.filter((e) => e.status === 'opened' || e.status === 'clicked').length;
    return {
      accountId: acc.id,
      accountName: acc.name,
      fromEmail: acc.fromEmail,
      totalSent: accSent,
      opened: accOpened,
      openRate: accSent > 0 ? Math.round((accOpened / accSent) * 100) : 0,
    };
  });

  return NextResponse.json({
    summary: {
      totalAccounts: accounts.length,
      totalSent,
      delivered,
      opened,
      clicked,
      bounced,
      deliveryRate,
      openRate,
      clickRate,
    },
    accountBreakdown,
  });
}
