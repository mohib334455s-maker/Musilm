/** True when the storefront should run without PostgreSQL (Vercel preview / no DATABASE_URL). */
export function isDemoMode(): boolean {
  if (process.env.DEMO_MODE === "1" || process.env.DEMO_MODE === "true") return true;
  if (!process.env.DATABASE_URL) return true;
  return false;
}
