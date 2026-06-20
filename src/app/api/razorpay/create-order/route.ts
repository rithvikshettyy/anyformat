import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { billingCycle } = await req.json();

    const PLANS: Record<string, { amount: number; label: string }> = {
      monthly: { amount: 59900, label: 'Enterprise Monthly' },
      yearly: { amount: 600000, label: 'Enterprise Yearly' },
    };

    const plan = PLANS[billingCycle];
    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Invalid billing cycle' },
        { status: 400 }
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { success: false, error: 'Payment not configured' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64'),
      },
      body: JSON.stringify({
        amount: plan.amount,
        currency: 'INR',
        receipt: `ent_${Date.now()}`,
        notes: {
          email: session.user.email,
          plan: 'enterprise',
          billingCycle,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Razorpay create order error:', err);
      return NextResponse.json(
        { success: false, error: 'Failed to create order' },
        { status: 500 }
      );
    }

    const order = await response.json();

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
      },
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
