import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "@/components/providers";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Muslim Store | مسلم استور — مواد خوراکی عمده و پرچون",
    template: "%s | Muslim Store",
  },
  description:
    "فروشگاه آنلاین مواد خوراکی برندهای افغانستانی در مزارشریف؛ الکوزی، شعیب، سلطان تازه، پامیر، هرات زعفران، صادق‌یار و بیشتر — با قیمت عمده خودکار و تحویل همان روز.",
  keywords: [
    "مسلم استور",
    "Muslim Store",
    "برندهای افغانستانی",
    "الکوزی",
    "سلطان تازه",
    "زعفران هرات",
    "روغن شعیب",
    "خرید عمده مزارشریف",
    "سبد ماهانه",
  ],
  authors: [{ name: "Muslim Store" }],
  creator: "Muslim Store",
  publisher: "Muslim Store",
  category: "shopping",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fa_AF",
    siteName: "Muslim Store | مسلم استور",
    title: "Muslim Store | مسلم استور — عمده و پرچون مواد خوراکی",
    description:
      "خرید مواد خوراکی خانه و دکان در مزارشریف با قیمت روشن، قیمت عمده خودکار و تحویل همان روز.",
    url: "/",
    images: [{ url: "/images/hero-market.jpg", width: 1200, height: 630, alt: "Muslim Store — برندهای افغانستانی" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Muslim Store | مسلم استور",
    description: "عمده و پرچون مواد خوراکی در مزارشریف",
  },
  robots: { index: true, follow: true },
  formatDetection: { telephone: true, address: true, email: true },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700&family=Archivo:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        <Providers user={user}>{children}</Providers>
      </body>
    </html>
  );
}
