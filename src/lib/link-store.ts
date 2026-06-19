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

export interface StoredLink {
  longUrl: string;
  shortCode: string;
  createdAt: string;
  userId?: string;
  clicks: number;
  lastClicked?: string;
}

// In-memory fallback for development
const memoryLinks = new Map<string, StoredLink>();
const memoryUserLinks = new Map<string, Set<string>>();
const memoryMonthlyCount = new Map<string, number>();

function redisKey(code: string) {
  return `link:${code.toLowerCase()}`;
}

function userLinksKey(userId: string) {
  return `user:${userId}:links`;
}

function monthlyCountKey(userId: string) {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return `user:${userId}:linkcount:${month}`;
}

function ipMonthlyCountKey(ip: string) {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return `ip:${ip}:linkcount:${month}`;
}

export async function createShortLink(
  longUrl: string,
  shortCode: string,
  userId?: string
): Promise<StoredLink> {
  const link: StoredLink = {
    longUrl,
    shortCode,
    createdAt: new Date().toISOString(),
    userId,
    clicks: 0,
  };

  if (redis) {
    try {
      const key = redisKey(shortCode);
      await redis.hset(key, {
        longUrl: link.longUrl,
        shortCode: link.shortCode,
        createdAt: link.createdAt,
        userId: link.userId || '',
        clicks: '0',
        lastClicked: '',
      });

      if (userId) {
        await redis.sadd(userLinksKey(userId), shortCode);
      }

      return link;
    } catch (err) {
      console.error('Redis createShortLink error, falling back to memory:', err);
    }
  }

  memoryLinks.set(shortCode.toLowerCase(), link);
  if (userId) {
    const set = memoryUserLinks.get(userId) || new Set();
    set.add(shortCode);
    memoryUserLinks.set(userId, set);
  }

  return link;
}

export async function getShortLink(code: string): Promise<StoredLink | null> {
  if (redis) {
    try {
      const data = await redis.hgetall(redisKey(code)) as Record<string, string> | null;
      if (!data || !data.longUrl) return null;
      return {
        longUrl: data.longUrl,
        shortCode: data.shortCode,
        createdAt: data.createdAt,
        userId: data.userId || undefined,
        clicks: parseInt(data.clicks || '0', 10),
        lastClicked: data.lastClicked || undefined,
      };
    } catch (err) {
      console.error('Redis getShortLink error, falling back to memory:', err);
    }
  }

  return memoryLinks.get(code.toLowerCase()) || null;
}

export async function shortCodeExists(code: string): Promise<boolean> {
  if (redis) {
    try {
      const exists = await redis.exists(redisKey(code));
      return exists === 1;
    } catch (err) {
      console.error('Redis shortCodeExists error, falling back to memory:', err);
    }
  }

  return memoryLinks.has(code.toLowerCase());
}

export async function incrementClicks(code: string): Promise<void> {
  const now = new Date().toISOString();

  if (redis) {
    try {
      const key = redisKey(code);
      await redis.hincrby(key, 'clicks', 1);
      await redis.hset(key, { lastClicked: now });
      return;
    } catch (err) {
      console.error('Redis incrementClicks error:', err);
    }
  }

  const link = memoryLinks.get(code.toLowerCase());
  if (link) {
    link.clicks++;
    link.lastClicked = now;
  }
}

export async function getUserLinks(userId: string): Promise<StoredLink[]> {
  if (redis) {
    try {
      const codes = await redis.smembers(userLinksKey(userId));
      const links: StoredLink[] = [];
      for (const code of codes) {
        const link = await getShortLink(code);
        if (link) links.push(link);
      }
      return links.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      console.error('Redis getUserLinks error, falling back to memory:', err);
    }
  }

  const codes = memoryUserLinks.get(userId);
  if (!codes) return [];
  const links: StoredLink[] = [];
  codes.forEach((code) => {
    const link = memoryLinks.get(code.toLowerCase());
    if (link) links.push(link);
  });
  return links.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function deleteLink(code: string, userId?: string): Promise<boolean> {
  if (redis) {
    try {
      const deleted = await redis.del(redisKey(code));
      if (userId) {
        await redis.srem(userLinksKey(userId), code);
      }
      return deleted === 1;
    } catch (err) {
      console.error('Redis deleteLink error, falling back to memory:', err);
    }
  }

  const existed = memoryLinks.delete(code.toLowerCase());
  if (userId) {
    memoryUserLinks.get(userId)?.delete(code);
  }
  return existed;
}

export async function getUserMonthlyCount(userId: string): Promise<number> {
  if (redis) {
    try {
      const count = await redis.get(monthlyCountKey(userId));
      return typeof count === 'number' ? count : parseInt(String(count || '0'), 10);
    } catch (err) {
      console.error('Redis getUserMonthlyCount error, falling back to memory:', err);
    }
  }

  return memoryMonthlyCount.get(monthlyCountKey(userId)) || 0;
}

export async function incrementUserMonthlyCount(userId: string): Promise<void> {
  if (redis) {
    try {
      const key = monthlyCountKey(userId);
      await redis.incr(key);
      // Expire at end of month + 1 day buffer (max ~32 days)
      await redis.expire(key, 32 * 24 * 60 * 60);
      return;
    } catch (err) {
      console.error('Redis incrementUserMonthlyCount error, falling back to memory:', err);
    }
  }

  const key = monthlyCountKey(userId);
  memoryMonthlyCount.set(key, (memoryMonthlyCount.get(key) || 0) + 1);
}

export async function getIpMonthlyCount(ip: string): Promise<number> {
  if (redis) {
    try {
      const count = await redis.get(ipMonthlyCountKey(ip));
      return typeof count === 'number' ? count : parseInt(String(count || '0'), 10);
    } catch (err) {
      console.error('Redis getIpMonthlyCount error, falling back to memory:', err);
    }
  }

  return memoryMonthlyCount.get(ipMonthlyCountKey(ip)) || 0;
}

export async function incrementIpMonthlyCount(ip: string): Promise<void> {
  if (redis) {
    try {
      const key = ipMonthlyCountKey(ip);
      await redis.incr(key);
      await redis.expire(key, 32 * 24 * 60 * 60);
      return;
    } catch (err) {
      console.error('Redis incrementIpMonthlyCount error, falling back to memory:', err);
    }
  }

  const key = ipMonthlyCountKey(ip);
  memoryMonthlyCount.set(key, (memoryMonthlyCount.get(key) || 0) + 1);
}
