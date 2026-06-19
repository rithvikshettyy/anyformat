'use client';

import { useSession, signIn } from 'next-auth/react';
import { useState } from 'react';
import Link from 'next/link';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: () => void) => void;
    };
  }
}

const FREE_LIMIT = 15;

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
    cta: 'Subscribe Now',
    highlighted: true,
  },
];

export default function PricingPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const tier = (session?.user as { tier?: string } | undefined)?.tier || 'free';

  async function handleSubscribe() {
    if (!session) {
      signIn('google');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/razorpay/subscribe', { method: 'POST' });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to start subscription');
        return;
      }

      const options = {
        key: data.data.keyId,
        subscription_id: data.data.subscriptionId,
        name: 'AnyFormat',
        description: 'Enterprise Plan - Monthly',
        handler: () => {
          window.location.href = '/dashboard';
        },
        prefill: {
          email: session.user?.email || '',
          name: session.user?.name || '',
        },
        theme: {
          color: '#e03d2f',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!confirm('Cancel your Enterprise subscription? You will lose access at end of billing period.')) return;

    setLoading(true);
    try {
      const res = await fetch('/api/razorpay/portal', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        window.location.reload();
      } else {
        setError(data.error || 'Failed to cancel');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />
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
                    <button
                      onClick={handleCancel}
                      disabled={loading}
                      className="w-full py-3 rounded-xl font-semibold border border-surface-border text-text-secondary hover:bg-surface-hover transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Processing...' : 'Cancel Subscription'}
                    </button>
                  ) : (
                    <button
                      onClick={handleSubscribe}
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
