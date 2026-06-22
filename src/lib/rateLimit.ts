/**
 * src/lib/rateLimit.ts
 *
 * Simple in-memory rate limiter for Next.js API routes.
 * No external dependencies — uses a Map with sliding window.
 *
 * Usage:
 *   const result = rateLimit(req, { limit: 5, windowMs: 60_000 });
 *   if (!result.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 */

interface RateLimitOptions {
  /** Max requests per window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
  /** Optional key prefix to namespace different routes */
  prefix?: string;
}

interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

interface Entry {
  count: number;
  resetAt: number;
}

// Module-level store — persists across requests in the same Node.js process
const store = new Map<string, Entry>();

// Clean up expired entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    store.forEach((entry, key) => {
      if (now > entry.resetAt) store.delete(key);
    });
  }, 5 * 60 * 1000);
}

export function rateLimit(
  req: { headers: { get(name: string): string | null } },
  options: RateLimitOptions
): RateLimitResult {
  const { limit, windowMs, prefix = "rl" } = options;
  const now = Date.now();

  // Identify the caller by IP (works on Vercel/Next.js)
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const key = `${prefix}:${ip}`;
  const existing = store.get(key);

  if (!existing || now > existing.resetAt) {
    // First request in this window
    const entry: Entry = { count: 1, resetAt: now + windowMs };
    store.set(key, entry);
    return { ok: true, remaining: limit - 1, resetAt: entry.resetAt };
  }

  existing.count += 1;
  const remaining = Math.max(0, limit - existing.count);
  return {
    ok: existing.count <= limit,
    remaining,
    resetAt: existing.resetAt,
  };
}
