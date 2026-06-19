import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { setUserTier, clearRazorpaySubscription } from '@/lib/user-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret || !signature) {
      return NextResponse.json({ error: 'Missing webhook config' }, { status: 400 });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);
    const eventType = event.event;

    switch (eventType) {
      case 'subscription.activated':
      case 'subscription.charged': {
        const email = event.payload?.subscription?.entity?.notes?.email
          || event.payload?.payment?.entity?.email;
        if (email) {
          await setUserTier(email, 'enterprise');
        }
        break;
      }

      case 'subscription.cancelled':
      case 'subscription.halted':
      case 'subscription.expired': {
        const email = event.payload?.subscription?.entity?.notes?.email;
        if (email) {
          await setUserTier(email, 'free');
          await clearRazorpaySubscription(email);
        }
        break;
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
