import { NextResponse } from 'next/server';
import { fetchAllDomains, fetchDomainsForAccount } from '@/lib/resend/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId');

  try {
    if (accountId && accountId !== 'all') {
      const domains = await fetchDomainsForAccount(accountId);
      return NextResponse.json({ domains });
    } else {
      const domains = await fetchAllDomains();
      return NextResponse.json({ domains });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch domain records' }, { status: 500 });
  }
}
