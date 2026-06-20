import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import crypto from 'crypto';
import { setUserTier } from '@/lib/user-store';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: 'Missing payment details' },
        { status: 400 }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json(
        { success: false, error: 'Payment not configured' },
        { status: 500 }
      );
    }

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { success: false, error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    // Fetch order to get billing cycle from notes
    const keyId = process.env.RAZORPAY_KEY_ID;
    const orderRes = await fetch(`https://api.razorpay.com/v1/orders/${razorpay_order_id}`, {
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64'),
      },
    });
    const order = await orderRes.json();
    const billingCycle = order?.notes?.billingCycle || 'monthly';

    const TTL: Record<string, number> = {
      monthly: 30 * 24 * 60 * 60,
      yearly: 365 * 24 * 60 * 60,
    };

    await setUserTier(session.user.email, 'enterprise', TTL[billingCycle]);

    return NextResponse.json({
      success: true,
      data: {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        billingCycle,
      },
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    return NextResponse.json(
      { success: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}
