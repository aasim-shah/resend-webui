import { NextResponse } from 'next/server';
import { sendEmailViaAccount } from '@/lib/resend/client';
import { SendEmailPayload } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body: SendEmailPayload = await request.json();
    const { accountId, to, subject } = body;

    if (!accountId) {
      return NextResponse.json({ error: 'Account selection is required' }, { status: 400 });
    }
    if (!to || (Array.isArray(to) && to.length === 0)) {
      return NextResponse.json({ error: 'Recipient address (to) is required' }, { status: 400 });
    }
    if (!subject) {
      return NextResponse.json({ error: 'Email subject is required' }, { status: 400 });
    }

    const emailRecord = await sendEmailViaAccount(body);

    return NextResponse.json({
      success: true,
      email: emailRecord,
      message: body.isDryRun ? 'Dry run completed successfully (no real email sent)' : 'Email sent successfully via Resend',
    });
  } catch (error: any) {
    console.error('Error sending email via API:', error);
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
  }
}
