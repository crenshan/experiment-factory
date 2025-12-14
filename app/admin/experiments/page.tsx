"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/app/providers";
import { fetchGraphQL } from "@/lib/graphql/fetchGraphQL";
import { ui } from "@/lib/ui";

type Experiment = {
  id: string;
  name: string;
  status: "DRAFT" | "RUNNING" | "PAUSED";
  updatedAt: string;
};

export default function ExperimentsListPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Experiment[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        if (!user) {
          // Should be gated by AdminLayout, but keep UI stable if it happens.
          setItems([]);
          return;
        }

        const token = await user.getIdToken();
        const data = await fetchGraphQL<{ experiments: Experiment[] }, undefined>({
          token,
          query: /* GraphQL */ `
            query {
              experiments {
                id
                name
                status
                updatedAt
              }
            }
          `,
        });

        if (!cancelled) setItems(data.experiments);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load experiments");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <main className={ui.page}>
      <div className={ui.card}>
        <div className="flex items-center gap-3">
          <div>
            <h1 className={ui.h1}>Experiments</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Create, edit, and manage experiment configuration.
            </p>
          </div>

          <div className="flex-1" />

          <Link className={ui.button.primary} href="/admin/experiments/new">
            New experiment
          </Link>
        </div>

        <div className="mt-6">
          {loading ? <p className={ui.p}>Loading…</p> : null}
          {error ? <p className={ui.error}>{error}</p> : null}

          {!loading && !error && items.length === 0 ? (
            <div className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm text-zinc-700">No experiments yet.</p>
              <p className="mt-2 text-sm text-zinc-600">
                Create one to start wiring up journeys and assignment in Phase 5+.
              </p>
            </div>
          ) : null}

          {!loading && !error && items.length > 0 ? (
            <div className={ui.table.wrap}>
              <table className={ui.table.table}>
                <thead>
                  <tr>
                    <th className={ui.table.th}>Name</th>
                    <th className={ui.table.th}>Status</th>
                    <th className={ui.table.th}>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((exp) => (
                    <tr key={exp.id} className="hover:bg-zinc-50">
                      <td className={ui.table.td}>
                        <Link className={ui.link} href={`/admin/experiments/${exp.id}`}>
                          {exp.name}
                        </Link>
                        <div className="mt-1 text-xs text-zinc-500">
                          <span className="font-mono">{exp.id}</span>
                        </div>
                      </td>
                      <td className={ui.table.td}>
                        <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-700">
                          {exp.status}
                        </span>
                      </td>
                      <td className={ui.table.td}>
                        <span className="text-zinc-700">
                          {new Date(exp.updatedAt).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <div className="mt-6">
            <Link className={ui.link} href="/admin">
              Back to Admin
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
