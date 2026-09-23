/**
 * Serverless-safe rate limiting.
 *
 * Production with UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN uses
 * Upstash REST + one atomic Redis EVAL call, so the counter is shared across
 * Vercel/serverless instances. Without credentials we keep a local fallback
 * for development and recovery; production logs a warning so the deployment
 * owner can finish the distributed configuration.
 */

type RateState = { count: number; resetAt: number };
const localStore = new Map<string, RateState>();
let missingEnvWarned = false;

export type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  distributed: boolean;
};

const LUA_INCREMENT = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('PTTL', KEYS[1])
return {current, ttl}
`;

function getUpstashConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ''), token };
}

function cleanupLocalStore(now: number): void {
  for (const [key, value] of localStore) {
    if (value.resetAt <= now) localStore.delete(key);
  }
}

function localRateLimit(identifier: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  cleanupLocalStore(now);
  const current = localStore.get(identifier);
  if (!current || current.resetAt <= now) {
    const resetAt = now + config.windowMs;
    localStore.set(identifier, { count: 1, resetAt });
    return { allowed: true, remaining: Math.max(config.maxRequests - 1, 0), resetAt, distributed: false };
  }
  current.count += 1;
  return {
    allowed: current.count <= config.maxRequests,
    remaining: Math.max(config.maxRequests - current.count, 0),
    resetAt: current.resetAt,
    distributed: false,
  };
}

async function distributedRateLimit(identifier: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const upstash = getUpstashConfig();
  if (!upstash) return localRateLimit(identifier, config);

  const key = `madina:rl:v2:${identifier}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1800);

  try {
    const response = await fetch(upstash.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${upstash.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(['EVAL', LUA_INCREMENT, 1, key, String(Math.max(config.windowMs, 1000))]),
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`Upstash rate limit HTTP ${response.status}`);
    const payload = (await response.json()) as { result?: unknown; error?: string };
    if (payload.error) throw new Error(payload.error);

    const result = Array.isArray(payload.result) ? payload.result : [];
    const count = Number(result[0] ?? 1);
    const ttlMs = Math.max(Number(result[1] ?? config.windowMs), 1000);
    const resetAt = Date.now() + ttlMs;
    return {
      allowed: count <= config.maxRequests,
      remaining: Math.max(config.maxRequests - count, 0),
      resetAt,
      distributed: true,
    };
  } catch (error) {
    // Availability wins over hard-failing login/contact/newsletter when the
    // external limiter is temporarily unreachable. The local guard still
    // provides a best-effort safety net for a single warm instance.
    console.error('[rate-limit] distributed limiter unavailable; using local fallback', error);
    return localRateLimit(identifier, config);
  } finally {
    clearTimeout(timeout);
  }
}

export async function checkRateLimit(identifier: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const result = await distributedRateLimit(identifier, config);
  if (!result.distributed && process.env.NODE_ENV === 'production' && !getUpstashConfig() && !missingEnvWarned) {
    missingEnvWarned = true;
    console.warn('[rate-limit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not configured; production rate limiting is instance-local until configured.');
  }
  return result;
}

export function rateLimitHeaders(result: RateLimitResult): Headers {
  const headers = new Headers();
  headers.set('X-RateLimit-Remaining', String(result.remaining));
  headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));
  return headers;
}

export const RATE_LIMITS = {
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 10 },
  upload: { windowMs: 60 * 1000, maxRequests: 5 },
  search: { windowMs: 60 * 1000, maxRequests: 30 },
  webhook: { windowMs: 60 * 1000, maxRequests: 100 },
  general: { windowMs: 60 * 1000, maxRequests: 60 },
} as const;
