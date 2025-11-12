// Simple in-memory rate limiter
// For production, use Redis-based solution

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export function rateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = store[identifier];

  // Clean up old entries
  if (record && now > record.resetTime) {
    delete store[identifier];
  }

  if (!store[identifier]) {
    store[identifier] = {
      count: 1,
      resetTime: now + windowMs,
    };
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: store[identifier].resetTime,
    };
  }

  store[identifier].count++;

  const allowed = store[identifier].count <= maxRequests;
  const remaining = Math.max(0, maxRequests - store[identifier].count);

  return {
    allowed,
    remaining,
    resetTime: store[identifier].resetTime,
  };
}

export function getRateLimitHeaders(
  limit: number,
  remaining: number,
  resetTime: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': new Date(resetTime).toISOString(),
  };
}
