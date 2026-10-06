"use client";

import Link from "next/link";

/** Basket + leaf mark — transparent PNG */
export function LogoMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/logo-mark.png"
      width={size}
      height={size}
      alt="نشان Muslim Store"
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
}

/**
 * Full brand lockup (English + فارسی already in the artwork).
 * On dark surfaces we place it on a soft white chip so teal/lime stay readable.
 */
export function Logo({
  tone = "light",
  size = 42,
  href = "/",
  className = "",
  showText = true,
}: {
  tone?: "light" | "dark";
  size?: number;
  href?: string;
  className?: string;
  showText?: boolean;
  /** kept for call-site compatibility; artwork already includes wordmark */
  tagline?: boolean;
}) {
  const height = showText ? Math.round(size * 2.2) : size;
  const width = showText ? Math.round(height * (636 / 595)) : size;

  return (
    <Link
      href={href}
      className={`group flex shrink-0 items-center ${className}`}
      aria-label="Muslim Store — مسلم استور"
    >
      <span
        className={`relative block transition-transform duration-300 group-hover:-translate-y-[2px] ${
          tone === "dark" ? "rounded-xl bg-white px-2.5 py-1.5 shadow-sm" : ""
        }`}
        style={{ width: tone === "dark" && showText ? width + 20 : width, height: tone === "dark" && showText ? height + 12 : height }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={showText ? "/brand/logo.png" : "/brand/logo-mark.png"}
          alt="Muslim Store | مسلم استور"
          className="h-full w-full object-contain"
          draggable={false}
        />
      </span>
    </Link>
  );
}
