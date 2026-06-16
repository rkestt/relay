import { LRUCache } from "lru-cache";

type RateLimitConfig = {
  interval: number; // milliseconds
  maxRequests: number;
};

export function rateLimit(config: RateLimitConfig) {
  const cache = new LRUCache<string, { count: number; resetTime: number }>({
    max: 1000,
    ttl: config.interval,
  });

  return {
    check: (key: string) => {
      const now = Date.now();
      const record = cache.get(key);

      if (!record) {
        cache.set(key, {
          count: 1,
          resetTime: now + config.interval,
        });
        return {
          success: true,
          remaining: config.maxRequests - 1,
          resetTime: now + config.interval,
        };
      }

      if (now > record.resetTime) {
        cache.set(key, {
          count: 1,
          resetTime: now + config.interval,
        });
        return {
          success: true,
          remaining: config.maxRequests - 1,
          resetTime: now + config.interval,
        };
      }

      if (record.count >= config.maxRequests) {
        return { success: false, remaining: 0, resetTime: record.resetTime };
      }

      record.count++;
      cache.set(key, record);
      return {
        success: true,
        remaining: config.maxRequests - record.count,
        resetTime: record.resetTime,
      };
    },
  };
}

// Preset per auth endpoints
export const authRateLimit = rateLimit({
  interval: 15 * 60 * 1000,
  maxRequests: 5,
}); // 5 requests per 15 min
export const apiRateLimit = rateLimit({
  interval: 60 * 1000,
  maxRequests: 60,
}); // 60 requests per min
