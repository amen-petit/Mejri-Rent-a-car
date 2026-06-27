/**
 * Distributed rate limiting.
 *
 * Uses Upstash Redis (a sliding-window limiter shared across all serverless
 * instances) when configured, so the limits actually hold on Vercel / any
 * multi-instance host. When the Upstash env vars are absent — e.g. local dev —
 * it transparently falls back to an in-memory fixed-window limiter so the app
 * still runs without external services. In production, a missing Upstash config
 * logs a one-time warning because the in-memory fallback is NOT safe there.
 *
 * Required env (production):
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimitResult = { ok: boolean; retryAfter: number };

// ─────────────────────────────────────────────────────────────────────────────
// In-memory fallback (fixed window). Per-instance only — fine for local dev.
// ─────────────────────────────────────────────────────────────────────────────
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function memoryRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (bucket.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { ok: true, retryAfter: 0 };
}

// ─────────────────────────────────────────────────────────────────────────────
// Upstash (distributed). Lazily created; one Ratelimit instance is cached per
// (limit, window) pair because the algorithm config is baked into the instance.
// ─────────────────────────────────────────────────────────────────────────────
let redisClient: Redis | null | undefined; // undefined = not resolved yet
let warnedMissing = false;

function getRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    redisClient = null;
    if (process.env.NODE_ENV === "production" && !warnedMissing) {
      warnedMissing = true;
      console.warn(
        "[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN not set — using in-memory " +
          "fallback, which does NOT enforce limits across serverless instances.",
      );
    }
    return redisClient;
  }

  redisClient = new Redis({ url, token });
  return redisClient;
}

const limiters = new Map<string, Ratelimit>();

function getLimiter(limit: number, windowMs: number): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;

  const id = `${limit}:${windowMs}`;
  let limiter = limiters.get(id);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      prefix: "rl",
      analytics: false,
    });
    limiters.set(id, limiter);
  }
  return limiter;
}

/**
 * Consume one token for `key`. Allows `limit` requests per `windowMs`.
 * Async because the distributed path makes a network round-trip to Redis.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const limiter = getLimiter(limit, windowMs);
  if (!limiter) return memoryRateLimit(key, limit, windowMs);

  try {
    const res = await limiter.limit(key);
    if (res.success) return { ok: true, retryAfter: 0 };
    const retryAfter = Math.max(1, Math.ceil((res.reset - Date.now()) / 1000));
    return { ok: false, retryAfter };
  } catch (error) {
    // Never let a limiter outage take down the endpoint it protects: fail open,
    // but log so the outage is visible.
    console.error(
      "[rate-limit] Upstash error, allowing request:",
      error instanceof Error ? error.message : "unknown error",
    );
    return { ok: true, retryAfter: 0 };
  }
}

/**
 * Best-effort client IP for rate-limit keys.
 *
 * On a trusted proxy (Vercel) `x-real-ip` is set to the connecting peer and
 * `x-forwarded-for`'s first entry is the client. We prefer `x-real-ip`, then the
 * left-most `x-forwarded-for`. NOTE: behind an untrusted/misconfigured proxy
 * these headers are spoofable — only rely on them where a trusted proxy sets
 * them (which is the case on Vercel).
 */
export function getClientIp(req: Request): string {
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();

  return "unknown";
}
