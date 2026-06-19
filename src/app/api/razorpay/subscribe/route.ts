import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getRazorpayCustomerId,
  setRazorpayCustomerId,
  setRazorpaySubscriptionId,
} from '@/lib/user-store';

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
    const name = session.user.name || '';
    const planId = process.env.RAZORPAY_PLAN_ID_ENTERPRISE;

    if (!planId) {
      return NextResponse.json(
        { success: false, error: 'Payment not configured' },
        { status: 500 }
      );
    }

    // Get or create Razorpay customer
    let customerId = await getRazorpayCustomerId(email);

    if (!customerId) {
      const customer = await (getRazorpay().customers.create({
        name,
        email,
        fail_existing: 0,
      }) as Promise<{ id: string }>);
      customerId = customer.id;
      await setRazorpayCustomerId(email, customerId!);
    }

    // Create subscription
    const subscription = await getRazorpay().subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 120,
    });

    await setRazorpaySubscriptionId(email, subscription.id);

    return NextResponse.json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error('Razorpay subscribe error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
