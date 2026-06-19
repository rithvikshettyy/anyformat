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
const ENTERPRISE_AMOUNT = 49900; // ₹499 in paise

const plans = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    description: 'For personal use and casual needs',
    features: [
      `${FREE_LIMIT} short URLs per month`,
      'Auto-generated short codes',
      'Basic click count',
      'All file conversion tools',
      'No tracking, full privacy',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Enterprise',
    price: '₹499',
    period: '/month',
    description: 'For businesses that need more',
    features: [
      'Unlimited short URLs',
      'Custom aliases for branded links',
      'Full click analytics dashboard',
      'API access for integrations',
      'Link management & deletion',
      'Priority support',
      'All file conversion tools',
    ],
    cta: 'Pay Now',
    highlighted: true,
  },
];

export default function PricingPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const tier = (session?.user as { tier?: string } | undefined)?.tier || 'free';

  async function handlePay() {
    if (!session) {
      signIn('google');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Step 1: Create order
      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: ENTERPRISE_AMOUNT, plan: 'enterprise' }),
      });
      const orderData = await orderRes.json();

      if (!orderData.success) {
        setError(orderData.error || 'Failed to create order');
        setLoading(false);
        return;
      }

      // Step 2: Open Razorpay checkout modal
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.data.amount,
        currency: orderData.data.currency,
        name: 'AnyFormat',
        description: 'Enterprise Plan',
        order_id: orderData.data.orderId,
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          // Step 3: Verify payment
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
            <p className="text-text-secondary text-lg max-w-xl mx-auto">
              All conversion tools are free forever. URL shortener has optional paid tiers for businesses.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 border transition-all ${
                  plan.highlighted
                    ? 'border-accent bg-accent-glow shadow-lg shadow-accent/10'
                    : 'border-surface-border bg-surface'
                }`}
              >
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-text-muted text-sm mb-4">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-text-muted ml-1">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-text-secondary">{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.highlighted ? (
                  tier === 'enterprise' ? (
                    <div className="w-full py-3 rounded-xl font-semibold border border-green-600 text-green-400 text-center">
                      Active
                    </div>
                  ) : (
                    <button
                      onClick={handlePay}
                      disabled={loading}
                      className="w-full py-3 rounded-xl font-semibold bg-accent hover:bg-accent-hover text-white transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Processing...' : plan.cta}
                    </button>
                  )
                ) : (
                  <Link
                    href="/tools"
                    className="block w-full py-3 rounded-xl font-semibold border border-surface-border text-center hover:bg-surface-hover transition-colors"
                  >
                    {plan.cta}
                  </Link>
                )}
              </div>
            ))}
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
