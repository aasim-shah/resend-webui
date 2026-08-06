import { NextResponse } from 'next/server';
import { getEmailRecords } from '@/lib/db/store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId') || 'all';
  const status = searchParams.get('status');
  const query = searchParams.get('query');

  let records = getEmailRecords(accountId);

  if (status && status !== 'all') {
    records = records.filter((r) => r.status === status);
  }

  if (query) {
    const q = query.toLowerCase();
    records = records.filter(
      (r) =>
        r.subject.toLowerCase().includes(q) ||
        (typeof r.to === 'string' && r.to.toLowerCase().includes(q)) ||
        (Array.isArray(r.to) && r.to.some((t) => t.toLowerCase().includes(q))) ||
        r.from.toLowerCase().includes(q)
    );
  }

  // Sort by newest first
  records.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

  return NextResponse.json({ emails: records });
}
