import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const SECRET = process.env.AUTH_SECRET || "muslim-store-secret-key-change-me";
export const SESSION_COOKIE = "ms_session";

export function hashPassword(password: string): string {
  const salt = randomBytes(12).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 32);
  const existing = Buffer.from(hash, "hex");
  return candidate.length === existing.length && timingSafeEqual(candidate, existing);
}

function sign(value: string): string {
  return createHmac("sha256", SECRET).update(value).digest("base64url");
}

export function createSessionToken(customerId: number, role: string): string {
  const payload = `${customerId}.${role}.${Date.now()}`;
  return `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;
}

/** sessions live for 7 days, then the user must sign in again */
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function readSessionToken(token: string | undefined): { id: number; role: string } | null {
  if (!token || token.length > 512) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  let payload: string;
  try {
    payload = Buffer.from(body, "base64url").toString("utf8");
  } catch {
    return null;
  }

  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  const [id, role, issued] = payload.split(".");
  if (!id || !role || !issued) return null;

  const issuedAt = Number(issued);
  if (!Number.isFinite(issuedAt)) return null;
  const age = Date.now() - issuedAt;
  if (age > SESSION_TTL_MS || age < -60_000) return null;
  if (!Number.isFinite(Number(id))) return null;

  return { id: Number(id), role: role === "admin" ? "admin" : "customer" };
}

export function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge,
  };
}

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  // Skip DB in demo mode / during production build
  if (process.env.NEXT_PHASE === "phase-production-build" || !process.env.DATABASE_URL) {
    return null;
  }

  const store = await cookies();
  const session = readSessionToken(store.get(SESSION_COOKIE)?.value);
  if (!session) return null;

  const { db } = await import("@/db");
  const { customers } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");

  const rows = await db
    .select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
      phone: customers.phone,
      role: customers.role,
    })
    .from(customers)
    .where(eq(customers.id, session.id))
    .limit(1);
  return rows[0] ?? null;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    throw new Error("unauthorized");
  }
  return user;
}
