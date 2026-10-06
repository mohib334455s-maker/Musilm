"use client";

import Link from "next/link";
import { useEffect } from "react";
import { LogoMark } from "@/components/logo";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-[560px] px-4 py-24 text-center md:py-32">
      <div className="mx-auto w-fit">
        <LogoMark size={52} />
      </div>
      <h1 className="mt-6 text-[24px] font-bold text-ink">مشکلی پیش آمد</h1>
      <p className="mt-2.5 text-[13.5px] leading-7 text-muted">
        صفحه مورد نظر به‌درستی بارگذاری نشد. می‌توانید دوباره تلاش کنید یا به فروشگاه برگردید.
      </p>
      {error.digest ? (
        <p className="num mt-3 inline-block rounded-md border border-line bg-brand-soft px-3 py-1.5 text-[11.5px] text-muted" dir="ltr">
          ref: {error.digest}
        </p>
      ) : null}
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="btn-shine inline-flex h-11 items-center rounded-md bg-brand px-5 text-sm font-medium text-white transition hover:bg-brand-dark"
        >
          تلاش دوباره
        </button>
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
