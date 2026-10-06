import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[560px] px-4 py-24 text-center md:py-32">
      <p className="display-font text-[44px] font-bold text-brand">404</p>
      <h1 className="mt-3 text-[22px] font-bold text-ink">صفحه پیدا نشد</h1>
      <p className="mt-2.5 text-[13.5px] leading-7 text-muted">
        محصول یا صفحه‌ای که به دنبال آن هستید وجود ندارد یا از فروشگاه حذف شده است.
      </p>
      <div className="mt-7 flex justify-center gap-3">
        <Link
          href="/products"
          className="inline-flex h-11 items-center rounded-md bg-brand px-5 text-sm font-medium text-white transition hover:bg-brand-dark"
        >
          دیدن محصولات
        </Link>
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-md border border-line px-5 text-sm text-ink transition hover:border-brand hover:text-brand"
        >
          صفحه اصلی
        </Link>
      </div>
    </div>
  );
}
