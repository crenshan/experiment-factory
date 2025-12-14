"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers";
import { ui } from "@/lib/ui";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading, isAdmin } = useAuth();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.replace("/");
    }
  }, [loading, user, isAdmin, router]);

  if (loading) {
    return (
      <main className={ui.page}>
        <div className={ui.card}>
          <h1 className={ui.h1}>Admin</h1>
          <p className={ui.p}>Loading…</p>
        </div>
      </main>
    );
  }

  if (!user || !isAdmin) {
    return (
      <main className={ui.page}>
        <div className={ui.card}>
          <h1 className={ui.h1}>Admin</h1>
          <p className={ui.p}>Redirecting…</p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
