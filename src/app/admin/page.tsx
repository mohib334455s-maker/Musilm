"use client";

import { AdminPanel } from "@/components/admin-panel";
import { useSession } from "@/components/providers";

export default function AdminPage() {
  const user = useSession();
  if (!user) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted">در حال بررسی دسترسی…</div>
    );
  }
  return <AdminPanel user={user} />;
}
