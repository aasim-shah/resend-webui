import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getEmailRecords } from '@/lib/db/store';

async function getActiveUserId(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('resend_auth_user');
  if (authCookie) {
    try {
      const user = JSON.parse(authCookie.value);
      return user.id;
    } catch (e) {
      return undefined;
    }
  }
  return undefined;
}

export async function GET(request: Request) {
  const userId = await getActiveUserId();
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId') || 'all';
  const status = searchParams.get('status');
  const query = searchParams.get('query');

  let records = getEmailRecords({ accountId, status: status || undefined, query: query || undefined, userId });

  // Sort by newest first
  records.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

  return NextResponse.json({ emails: records });
}
