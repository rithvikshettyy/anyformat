import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getRazorpaySubscriptionId, setUserTier, clearRazorpaySubscription } from '@/lib/user-store';

function getRazorpay() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Razorpay = require('razorpay');
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
  });
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const email = session.user.email;
    const subscriptionId = await getRazorpaySubscriptionId(email);

    if (!subscriptionId) {
      return NextResponse.json(
        { success: false, error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Cancel subscription at end of current billing period
    await getRazorpay().subscriptions.cancel(subscriptionId, false);
    await setUserTier(email, 'free');
    await clearRazorpaySubscription(email);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Razorpay portal error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to manage subscription' },
      { status: 500 }
    );
  }
}
