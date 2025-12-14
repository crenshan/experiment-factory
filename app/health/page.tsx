import { ui } from "@/lib/ui";

export default function HealthPage() {
  return (
    <main className={ui.page}>
      <div className={ui.card}>
        <h1 className={ui.h1}>OK</h1>
        <p className="mt-2 text-sm text-zinc-600">If you can see this page, routing is working.</p>
      </div>
    </main>
  );
}
