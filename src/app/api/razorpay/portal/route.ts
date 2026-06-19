import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Use /api/razorpay/create-order instead' },
    { status: 410 }
  );
}
