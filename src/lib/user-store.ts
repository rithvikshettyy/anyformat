import { Redis } from '@upstash/redis';

const hasCredentials =
  !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

let redis: Redis | null = null;
if (hasCredentials) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

export type UserTier = 'free' | 'enterprise';

// In-memory fallback
const memoryTiers = new Map<string, UserTier>();
const memoryRazorpay = new Map<string, { customerId?: string; subscriptionId?: string }>();

function tierKey(email: string) {
  return `user:${email}:tier`;
}

function razorpayCustomerKey(email: string) {
  return `user:${email}:razorpay_customer`;
}

function razorpaySubscriptionKey(email: string) {
  return `user:${email}:razorpay_subscription`;
}

export async function getUserTier(email: string): Promise<UserTier> {
  if (redis) {
    try {
      const tier = await redis.get(tierKey(email));
      if (tier === 'enterprise') return 'enterprise';
      return 'free';
    } catch (err) {
      console.error('Redis getUserTier error:', err);
    }
  }
  return memoryTiers.get(email) || 'free';
}

export async function setUserTier(email: string, tier: UserTier): Promise<void> {
  if (redis) {
    try {
      await redis.set(tierKey(email), tier);
      return;
    } catch (err) {
      console.error('Redis setUserTier error:', err);
    }
  }
  memoryTiers.set(email, tier);
}

export async function getRazorpayCustomerId(email: string): Promise<string | null> {
  if (redis) {
    try {
      const id = await redis.get(razorpayCustomerKey(email));
      return id as string | null;
    } catch (err) {
      console.error('Redis getRazorpayCustomerId error:', err);
    }
  }
  return memoryRazorpay.get(email)?.customerId || null;
}

export async function setRazorpayCustomerId(email: string, customerId: string): Promise<void> {
  if (redis) {
    try {
      await redis.set(razorpayCustomerKey(email), customerId);
      return;
    } catch (err) {
      console.error('Redis setRazorpayCustomerId error:', err);
    }
  }
  const existing = memoryRazorpay.get(email) || {};
  memoryRazorpay.set(email, { ...existing, customerId });
}

export async function getRazorpaySubscriptionId(email: string): Promise<string | null> {
  if (redis) {
    try {
      const id = await redis.get(razorpaySubscriptionKey(email));
      return id as string | null;
    } catch (err) {
      console.error('Redis getRazorpaySubscriptionId error:', err);
    }
  }
  return memoryRazorpay.get(email)?.subscriptionId || null;
}

export async function setRazorpaySubscriptionId(email: string, subscriptionId: string): Promise<void> {
  if (redis) {
    try {
      await redis.set(razorpaySubscriptionKey(email), subscriptionId);
      return;
    } catch (err) {
      console.error('Redis setRazorpaySubscriptionId error:', err);
    }
  }
  const existing = memoryRazorpay.get(email) || {};
  memoryRazorpay.set(email, { ...existing, subscriptionId });
}

export async function clearRazorpaySubscription(email: string): Promise<void> {
  if (redis) {
    try {
      await redis.del(razorpaySubscriptionKey(email));
      return;
    } catch (err) {
      console.error('Redis clearRazorpaySubscription error:', err);
    }
  }
  const existing = memoryRazorpay.get(email) || {};
  memoryRazorpay.set(email, { ...existing, subscriptionId: undefined });
}
