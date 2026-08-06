import { NextResponse } from 'next/server';
import { getAllAccounts } from '@/lib/resend/accounts';
import { saveCustomAccount, deleteCustomAccount } from '@/lib/db/store';
import { ResendAccount } from '@/lib/types';

export async function GET() {
  const accounts = getAllAccounts().map((acc) => ({
    ...acc,
    apiKeyMasked: acc.apiKey ? `${acc.apiKey.substring(0, 6)}...${acc.apiKey.slice(-4)}` : 'Not set',
    apiKey: undefined, // Hide full key in list response for security
  }));
  return NextResponse.json({ accounts });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, apiKey, fromEmail, fromName } = body;

    if (!name || !apiKey || !fromEmail) {
      return NextResponse.json({ error: 'Missing required fields: name, apiKey, fromEmail' }, { status: 400 });
    }

    const newAccount: ResendAccount = {
      id: `acc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to add account' }, { status: 500 });
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete account' }, { status: 500 });
  }
}
