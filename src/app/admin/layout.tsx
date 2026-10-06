import type { ReactNode } from "react";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";

export const metadata = { title: "پنل مدیریت | Muslim Store" };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();

  if (!user || user.role !== "admin") {
    return (
      <div className="grid min-h-screen place-items-center bg-brand-soft px-4">
        <div className="w-full max-w-md rounded-lg border border-line bg-white p-8 text-center">
          <p className="display-font text-[20px] font-bold text-brand">Muslim Store</p>
          <h1 className="mt-4 text-[18px] font-bold text-ink">دسترسی به پنل مدیریت</h1>
          <p className="mt-2 text-[13px] leading-7 text-muted">
            برای ورود به پنل ادمین باید با حساب مدیر وارد شوید.
          </p>
          <p className="mt-4 rounded-md border border-line bg-brand-soft px-4 py-3 text-[12px] leading-6 text-muted">
            دسترسی ادمین فقط با حساب مدیر امکان‌پذیر است. اعتبارنامه ورود در متغیرهای محیطی سرور
            نگهداری می‌شود و در هیچ صفحه‌ای نمایش داده نمی‌شود.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Link
              href="/account"
              className="inline-flex h-11 items-center rounded-md bg-brand px-5 text-sm font-medium text-white transition hover:bg-brand-dark"
            >
              ورود به حساب
            </Link>
            <Link
              href="/"
              className="inline-flex h-11 items-center rounded-md border border-line px-5 text-sm text-ink transition hover:border-brand hover:text-brand"
            >
              بازگشت به فروشگاه
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
