import { NextResponse } from 'next/server';
import { saveWebhookEvent, saveEmailRecord, readDb } from '@/lib/db/store';
import { WebhookEventRecord, EmailRecord } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { type, data, created_at } = payload;

    const eventRecord: WebhookEventRecord = {
      id: `wh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: type || 'unknown',
      createdAt: created_at || new Date().toISOString(),
      data: data || payload,
    };

    saveWebhookEvent(eventRecord);

    // Update email status if email_id is present
    const emailId = data?.email_id;
    if (emailId) {
      const db = readDb();
      const existing = db.emails.find((e) => e.resendId === emailId || e.id === emailId);
      if (existing) {
        let newStatus = existing.status;
        const now = new Date().toISOString();
        const update: Partial<EmailRecord> = {};

        if (type === 'email.delivered') {
          newStatus = 'delivered';
          update.deliveredAt = now;
        } else if (type === 'email.opened') {
          newStatus = 'opened';
          update.openedAt = now;
        } else if (type === 'email.clicked') {
          newStatus = 'clicked';
          update.clickedAt = now;
        } else if (type === 'email.bounced') {
          newStatus = 'bounced';
          update.bouncedAt = now;
        }

        saveEmailRecord({
          ...existing,
          ...update,
          status: newStatus,
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Webhook event processed' });
  } catch (error: any) {
    console.error('Error processing Resend webhook:', error);
    return NextResponse.json({ error: error.message || 'Webhook processing failed' }, { status: 500 });
  }
}
