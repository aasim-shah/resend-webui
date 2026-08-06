import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sendEmailViaAccount } from '@/lib/resend/client';
import { SendEmailPayload } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('resend_auth_user');
    let userId: string | undefined = undefined;
    if (authCookie) {
      try {
        userId = JSON.parse(authCookie.value).id;
      } catch (e) {}
    }

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

    const emailRecord = await sendEmailViaAccount({ ...body, userId });

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
