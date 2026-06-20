'use client';

import { useSession, signIn } from 'next-auth/react';
import { useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: Record<string, string>) => void) => void;
    };
  }
}

const FREE_LIMIT = 15;

const ENTERPRISE = {
  monthly: { price: 599, paise: 59900, perMonth: 599 },
  yearly: { price: 6000, paise: 600000, perMonth: 500 },
};

const YEARLY_DISCOUNT = Math.round(
  ((ENTERPRISE.monthly.perMonth - ENTERPRISE.yearly.perMonth) / ENTERPRISE.monthly.perMonth) * 100
);

const features = {
  free: [
    `${FREE_LIMIT} short URLs per month`,
    'Auto-generated short codes',
    'Basic click count',
    'All file conversion tools',
    'No tracking, full privacy',
  ],
  enterprise: [
    'Unlimited short URLs',
    'Custom aliases for branded links',
    'Full click analytics dashboard',
    'API access for integrations',
    'Link management & deletion',
    'Priority support',
    'All file conversion tools',
  ],
};

export default function PricingPage() {
  const { data: session, update: updateSession } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const tier = (session?.user as { tier?: string } | undefined)?.tier || 'free';

  const currentPlan = ENTERPRISE[billingCycle];

  async function handlePay() {
    if (!session) {
      signIn('google');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingCycle }),
      });
      const orderData = await orderRes.json();

      if (!orderData.success) {
        setError(orderData.error || 'Failed to create order');
        setLoading(false);
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.data.amount,
        currency: orderData.data.currency,
        name: 'AnyFormat',
        description: `Enterprise Plan (${billingCycle === 'yearly' ? 'Annual' : 'Monthly'})`,
        order_id: orderData.data.orderId,
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          try {
            const verifyRes = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              await updateSession();
              window.location.href = '/dashboard';
            } else {
              setError('Payment verification failed. Contact support.');
            }
          } catch {
            setError('Payment verification error. Contact support.');
          }
        },
        prefill: {
          email: session.user?.email || '',
          name: session.user?.name || '',
        },
        theme: {
          color: '#e03d2f',
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: Record<string, unknown>) => {
        const err = response?.error as Record<string, string> | undefined;
        setError(err?.description || 'Payment failed. Please try again.');
        setLoading(false);
      });
      rzp.open();
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="relative">
        <div className="absolute inset-0 grid-bg pointer-events-none" />

        <section className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-16 md:pt-24 pb-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Simple, transparent <span className="text-accent">pricing</span>
            </h1>
            <p className="text-text-secondary text-lg max-w-xl mx-auto mb-8">
              All conversion tools are free forever. URL shortener has optional paid tiers for businesses.
            </p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-3 bg-surface border border-surface-border rounded-full p-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-accent text-white'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  billingCycle === 'yearly'
                    ? 'bg-accent text-white'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Yearly
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  billingCycle === 'yearly'
                    ? 'bg-white/20 text-white'
                    : 'bg-green-500/20 text-green-400'
                }`}>
                  Save {YEARLY_DISCOUNT}%
                </span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free Plan */}
            <div className="rounded-2xl p-8 border border-surface-border bg-surface transition-all">
              <h3 className="text-xl font-bold mb-1">Free</h3>
              <p className="text-text-muted text-sm mb-4">For personal use and casual needs</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">₹0</span>
                <span className="text-text-muted ml-1">forever</span>
              </div>
              <ul className="space-y-3 mb-8">
                {features.free.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-text-secondary">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/tools"
                className="block w-full py-3 rounded-xl font-semibold border border-surface-border text-center hover:bg-surface-hover transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="rounded-2xl p-8 border border-accent bg-accent-glow shadow-lg shadow-accent/10 transition-all">
              <h3 className="text-xl font-bold mb-1">Enterprise</h3>
              <p className="text-text-muted text-sm mb-4">For businesses that need more</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">₹{currentPlan.perMonth}</span>
                <span className="text-text-muted ml-1">/month</span>
                {billingCycle === 'yearly' && (
                  <div className="mt-1">
                    <span className="text-text-muted text-sm">Billed ₹{currentPlan.price.toLocaleString('en-IN')}/year</span>
                    <span className="text-sm text-text-muted line-through ml-2">₹{(ENTERPRISE.monthly.perMonth * 12).toLocaleString('en-IN')}</span>
                  </div>
                )}
                {billingCycle === 'monthly' && (
                  <div className="mt-1 text-text-muted text-sm">Billed monthly</div>
                )}
              </div>
              <ul className="space-y-3 mb-8">
                {features.enterprise.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-text-secondary">{feature}</span>
                  </li>
                ))}
              </ul>
              {tier === 'enterprise' ? (
                <div className="w-full py-3 rounded-xl font-semibold border border-green-600 text-green-400 text-center">
                  Active
                </div>
              ) : (
                <button
                  onClick={handlePay}
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold bg-accent hover:bg-accent-hover text-white transition-colors disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Pay Now'}
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="max-w-3xl mx-auto mt-6 bg-red-900/20 border border-red-900/50 rounded-xl p-4 text-center">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="text-center mt-12 text-text-muted text-sm">
            <p>All plans include unlimited file conversions. Payments powered by Razorpay.</p>
            <p className="mt-1">Questions? Reach out on <a href="https://github.com/rithvikshettyy" className="text-accent hover:underline">GitHub</a>.</p>
          </div>
        </section>
      </div>
    </>
  );
}
