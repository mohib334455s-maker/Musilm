export default function Loading() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-6 md:py-14" aria-busy="true" aria-live="polite">
      <div className="h-7 w-52 animate-pulse rounded bg-brand-soft" />
      <div className="mt-3 h-4 w-32 animate-pulse rounded bg-brand-soft" />
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-lg border border-line bg-white">
            <div className="relative aspect-[4/3] bg-brand-soft">
              <div className="shimmer absolute inset-0" />
            </div>
            <div className="space-y-2 p-3">
              <div className="h-3 w-4/5 animate-pulse rounded bg-brand-soft" />
              <div className="h-3 w-3/5 animate-pulse rounded bg-brand-soft" />
              <div className="flex items-center justify-between pt-2">
                <div className="h-4 w-16 animate-pulse rounded bg-brand-soft" />
                <div className="h-8 w-16 animate-pulse rounded-md bg-brand-soft" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-[12.5px] text-muted">در حال بارگذاری فروشگاه…</p>
    </div>
  );
}
