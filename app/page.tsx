import Link from "next/link";
import { ui } from "@/lib/ui";

export default function HomePage() {
  return (
    <main className={ui.page}>
      <div className={ui.card}>
        <h1 className={ui.h1}>Experiment Factory</h1>

        <p className="mt-2 text-sm text-zinc-600">
          A Next.js + Firebase prototyping platform with deterministic A/B assignment and event logging.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Link className={`${ui.button.secondary} text-center`} href="/admin">
            Admin
          </Link>

          <Link className={`${ui.button.secondary} text-center`} href="/run">
            Runner
          </Link>
        </div>
      </div>
    </main>
  );
}
