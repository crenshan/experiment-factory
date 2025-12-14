import Link from "next/link";
import { ui } from "@/lib/ui";

export default function AdminHomePage() {
  return (
    <main className={ui.page}>
      <div className={ui.card}>
        <h1 className={ui.h1}>Admin</h1>
        <p className="mt-2 text-sm text-zinc-600">Platform controls and configuration.</p>

        <div className="mt-6">
          <Link className={ui.link} href="/admin/experiments">
            Experiments
          </Link>
        </div>
      </div>
    </main>
  );
}
