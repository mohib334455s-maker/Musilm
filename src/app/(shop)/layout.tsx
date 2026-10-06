import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { MobileNav, SiteFooter } from "@/components/site-footer";
import { BackToTop } from "@/components/motion";

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      <SiteHeader />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <SiteFooter />
      <MobileNav />
      <BackToTop />
    </div>
  );
}
