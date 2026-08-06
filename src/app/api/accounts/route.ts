import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAllAccounts } from '@/lib/resend/accounts';
import { saveCustomAccount, deleteCustomAccount } from '@/lib/db/store';
import { ResendAccount } from '@/lib/types';

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

export async function GET() {
  const userId = await getActiveUserId();
  const accounts = getAllAccounts(userId).map((acc) => ({
    ...acc,
    apiKeyMasked: acc.apiKey ? `${acc.apiKey.substring(0, 6)}...${acc.apiKey.slice(-4)}` : 'Not set',
    apiKey: undefined, // Hide full key in list response for security
  }));
  return NextResponse.json({ accounts });
}

export async function POST(request: Request) {
  try {
    const userId = await getActiveUserId();
    const body = await request.json();
    const { name, apiKey, fromEmail, fromName } = body;

    if (!name || !apiKey || !fromEmail) {
      return NextResponse.json({ error: 'Missing required fields: name, apiKey, fromEmail' }, { status: 400 });
    }

    const newAccount: ResendAccount = {
      id: `acc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: userId || 'user_demo',
      name,
      apiKey,
      fromEmail,
      fromName: fromName || name,
      source: 'custom',
      createdAt: new Date().toISOString(),
    };

    saveCustomAccount(newAccount);

    return NextResponse.json({
      success: true,
      account: {
        ...newAccount,
        apiKeyMasked: `${newAccount.apiKey.substring(0, 6)}...${newAccount.apiKey.slice(-4)}`,
        apiKey: undefined,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save account' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
    }
    deleteCustomAccount(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete account' }, { status: 500 });
  }
}
