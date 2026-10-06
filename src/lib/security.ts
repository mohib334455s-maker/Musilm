import { NextResponse } from "next/server";

type Hits = number[];
const buckets = new Map<string, Hits>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);

  if (hits.length >= limit) {
    buckets.set(key, hits);
    const oldest = hits[0] ?? now;
    return { ok: false as const, retryAfter: Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000)), remaining: 0 };
  }

  hits.push(now);
  buckets.set(key, hits);

  if (buckets.size > 4000) {
    for (const [k, v] of buckets) {
      if (!v.length || now - (v[v.length - 1] ?? now) > windowMs) buckets.delete(k);
    }
  }

  return { ok: true as const, retryAfter: 0, remaining: limit - hits.length };
}

export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim().slice(0, 45);
  return (req.headers.get("x-real-ip") ?? "local").slice(0, 45);
}

/**
 * Shared entry guard for state-changing / sensitive endpoints:
 * - rejects non-JSON mutations (mitigates simple-form CSRF together with SameSite=Lax)
 * - enforces a per-IP sliding-window rate limit
 * Returns an error response when the request must be blocked, otherwise null.
 */
export function guard(
  req: Request,
  opts: { route: string; limit?: number; windowMs?: number; json?: boolean; key?: string },
): NextResponse | null {
  if (opts.json !== false) {
    const ct = req.headers.get("content-type") ?? "";
    if (!ct.includes("application/json")) {
      return NextResponse.json({ error: "درخواست نامعتبر" }, { status: 415 });
    }
  }
  const limit = opts.limit ?? 30;
  const windowMs = opts.windowMs ?? 60_000;
  const id = `${opts.route}:${opts.key ?? clientIp(req)}`;
  const result = rateLimit(id, limit, windowMs);
  if (!result.ok) {
    return NextResponse.json(
      { error: "تعداد درخواست‌ها بیش از حد مجاز است؛ کمی بعد دوباره تلاش کنید" },
      {
        status: 429,
        headers: {
          "Retry-After": String(result.retryAfter),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }
  return null;
}

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** strips control characters, trims and clamps length */
export function cleanText(input: unknown, max: number): string {
  const raw = typeof input === "string" ? input : "";
  return raw.replace(CONTROL_CHARS, "").replace(/\s{3,}/g, "  ").trim().slice(0, max);
}

export function cleanPhone(input: unknown): string {
  const raw = typeof input === "string" ? input : "";
  return raw.replace(/[^\d+\-\s()]/g, "").trim().slice(0, 24);
}

export function cleanEmail(input: unknown): string {
  const raw = typeof input === "string" ? input : "";
  return raw.trim().toLowerCase().slice(0, 160);
}

/** escapes LIKE wildcards so user input cannot alter the search pattern */
export function escapeLike(input: string): string {
  return input.replace(/[\\%_]/g, (m) => `\\${m}`);
}

export function intInRange(input: unknown, min: number, max: number, fallback: number): number {
  const n = Number(input);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

export function passwordIssue(pw: string): string | null {
  if (typeof pw !== "string") return "رمز عبور نامعتبر است";
  if (pw.length < 8) return "رمز عبور باید حداقل ۸ نویسه باشد";
  if (pw.length > 128) return "رمز عبور خیلی طولانی است";
  if (!/[A-Za-z\u0600-\u06FF]/.test(pw)) return "رمز عبور باید حداقل یک حرف داشته باشد";
  if (!/\d/.test(pw)) return "رمز عبور باید حداقل یک عدد داشته باشد";
  const common = ["12345678", "password", "admin123", "123456789", "muslimstore"];
  if (common.some((c) => pw.toLowerCase().includes(c))) return "رمز عبور خیلی ساده است";
  return null;
}
