import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/demo";
import {
  SESSION_COOKIE,
  SESSION_TTL_MS,
  cookieOptions,
  createSessionToken,
  getSessionUser,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { cleanEmail, cleanPhone, cleanText, guard, passwordIssue, rateLimit, clientIp } from "@/lib/security";

export const dynamic = "force-dynamic";

const GENERIC = "ایمیل یا رمز عبور درست نیست";
const DEMO_MSG = "این نسخه نمایشی است و ورود/ثبت‌نام بدون دیتابیس فعال نیست";

export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({
    user: user ? { id: user.id, name: user.name, email: user.email, role: user.role } : null,
    demo: isDemoMode(),
  });
}

export async function POST(req: Request) {
  const blocked = guard(req, { route: "auth", limit: 25, windowMs: 60_000 });
  if (blocked) return blocked;

  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "");

  if (action === "logout") {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, "", cookieOptions(0));
    return res;
  }

  if (isDemoMode() && (action === "login" || action === "register")) {
    return NextResponse.json({ error: DEMO_MSG, demo: true }, { status: 503 });
  }

  const { db } = await import("@/db");
  const { customers } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");

  const email = cleanEmail(body.email);
  const password = typeof body.password === "string" ? body.password.slice(0, 128) : "";

  if (action === "register") {
    const signupBlock = guard(req, { route: "auth:register", limit: 5, windowMs: 10 * 60_000 });
    if (signupBlock) return signupBlock;

    const name = cleanText(body.name, 60);
    const phone = cleanPhone(body.phone);

    if (name.length < 2) return NextResponse.json({ error: "نام معتبر نیست" }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return NextResponse.json({ error: "ایمیل معتبر نیست" }, { status: 400 });
    }
    const issue = passwordIssue(password);
    if (issue) return NextResponse.json({ error: issue }, { status: 400 });
    if (phone && !/^[\d+\-\s()]{7,20}$/.test(phone)) {
      return NextResponse.json({ error: "شماره تماس معتبر نیست" }, { status: 400 });
    }

    const existing = await db.select({ id: customers.id }).from(customers).where(eq(customers.email, email)).limit(1);
    if (existing.length) {
      return NextResponse.json({ error: "ثبت‌نام با این ایمیل ممکن نشد" }, { status: 409 });
    }

    const created = await db
      .insert(customers)
      .values({ name, email, phone: phone || null, passwordHash: hashPassword(password), role: "customer" })
      .returning({ id: customers.id, role: customers.role });
    const user = created[0]!;

    const res = NextResponse.json({ ok: true, user: { id: user.id, name, email, phone, role: user.role } });
    res.cookies.set(SESSION_COOKIE, createSessionToken(user.id, user.role), cookieOptions(SESSION_TTL_MS / 1000));
    return res;
  }

  if (action === "login") {
    const ipBlock = guard(req, { route: "auth:login:ip", limit: 10, windowMs: 10 * 60_000 });
    if (ipBlock) return ipBlock;
    if (email) {
      const hit = rateLimit(`auth:login:acct:${email}`, 6, 10 * 60_000);
      if (!hit.ok) {
        return NextResponse.json(
          { error: `تلاش‌های ناموفق زیاد است؛ ${hit.retryAfter} ثانیه دیگر دوباره تلاش کنید` },
          { status: 429, headers: { "Retry-After": String(hit.retryAfter) } },
        );
      }
    }

    if (!email || !password) return NextResponse.json({ error: GENERIC }, { status: 401 });

    const rows = await db
      .select({
        id: customers.id,
        name: customers.name,
        email: customers.email,
        phone: customers.phone,
        role: customers.role,
        passwordHash: customers.passwordHash,
      })
      .from(customers)
      .where(eq(customers.email, email))
      .limit(1);
    const user = rows[0];

    if (!user || !verifyPassword(password, user.passwordHash)) {
      void clientIp(req);
      return NextResponse.json({ error: GENERIC }, { status: 401 });
    }

    const res = NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
    });
    res.cookies.set(SESSION_COOKIE, createSessionToken(user.id, user.role), cookieOptions(SESSION_TTL_MS / 1000));
    return res;
  }

  return NextResponse.json({ error: "action نامعتبر" }, { status: 400 });
}
