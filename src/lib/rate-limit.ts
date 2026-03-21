import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Graceful fallback if env vars not set (dev mode)
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

const limiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "60 s"),
    })
  : null

export async function rateLimit(key: string): Promise<{ allowed: boolean; remaining: number }> {
  if (!limiter) return { allowed: true, remaining: 999 } // dev fallback
  const { success, remaining } = await limiter.limit(key)
  return { allowed: success, remaining }
}
