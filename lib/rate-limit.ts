import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { LRUCache } from "lru-cache";

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in seconds
};

type RateLimitConfig = {
  interval: number; // milliseconds
  maxRequests: number;
  prefix: string;
};

// ── Upstash Redis implementation (production) ──
function createUpstashRatelimit(config: RateLimitConfig) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || "",
    token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
  });

  // Convert ms to a human-readable window string for Upstash
  const totalSeconds = Math.round(config.interval / 1000);
  const windowStr =
    totalSeconds >= 86400
      ? `${Math.round(totalSeconds / 86400)} d`
      : totalSeconds >= 3600
        ? `${Math.round(totalSeconds / 3600)} h`
        : totalSeconds >= 60
          ? `${Math.round(totalSeconds / 60)} m`
          : `${totalSeconds} s`;

  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.maxRequests, windowStr as Duration),
    analytics: true,
    prefix: config.prefix,
  });

  return {
    limit: async (identifier: string): Promise<RateLimitResult> => {
      const { success, limit, remaining, reset } =
        await ratelimit.limit(identifier);
      return { success, limit, remaining, reset };
    },
  };
}

// ── In-memory fallback (dev / no Upstash configured) ──
function createInMemoryRatelimit(config: RateLimitConfig) {
  const cache = new LRUCache<string, { count: number; resetTime: number }>({
    max: 1000,
    ttl: config.interval,
  });

  return {
    limit: async (identifier: string): Promise<RateLimitResult> => {
      const now = Date.now();
      const record = cache.get(identifier);

      if (!record || now > record.resetTime) {
        const resetTime = now + config.interval;
        cache.set(identifier, { count: 1, resetTime });
        return {
          success: true,
          limit: config.maxRequests,
          remaining: config.maxRequests - 1,
          reset: Math.floor(resetTime / 1000),
        };
      }

      if (record.count >= config.maxRequests) {
        return {
          success: false,
          limit: config.maxRequests,
          remaining: 0,
          reset: Math.floor(record.resetTime / 1000),
        };
      }

      record.count++;
      cache.set(identifier, record);
      return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - record.count,
        reset: Math.floor(record.resetTime / 1000),
      };
    },
  };
}

// ── Factory: picks Upstash when env is configured, otherwise in-memory ──
function createRatelimit(config: RateLimitConfig) {
  if (process.env.UPSTASH_REDIS_REST_URL) {
    return createUpstashRatelimit(config);
  }
  return createInMemoryRatelimit(config);
}

// ── Presets ──

/** 5 requests per 15 minutes — for auth endpoints */
export const authRateLimit = createRatelimit({
  interval: 15 * 60 * 1000,
  maxRequests: 5,
  prefix: "ratelimit:auth",
});

/** 60 requests per minute — for API endpoints */
export const apiRateLimit = createRatelimit({
  interval: 60 * 1000,
  maxRequests: 60,
  prefix: "ratelimit:api",
});
