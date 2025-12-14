"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchGraphQL } from "@/lib/graphql/fetchGraphQL";
import { ui } from "@/lib/ui";
import { useAuth } from "../providers";

type Experiment = {
  id: string;
  name: string;
  status?: string;
};

export default function RunIndexPage() {
  const { user, isAdmin } = useAuth();

  const [items, setItems] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        if(user && isAdmin) {
          const token = await user.getIdToken();
          const data = await fetchGraphQL<{ experiments: Experiment[] }, undefined>({
            token,
            query: /* GraphQL */ `
              query {
                experiments {
                  id
                  name
                  status
                }
              }
            `,
          });



        if (!cancelled) {
          setItems(data.experiments);
        }
      } else {
          const data = await fetchGraphQL<{ activeExperiments: Experiment[] }, undefined>({
            query: /* GraphQL */ `
              query {
                activeExperiments {
                  id
                  name
                }
              }
            `,
          });



        if (!cancelled) {
          setItems(data.activeExperiments);
        }
      }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load experiments");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, user]);

  return (
    <main className={ui.page}>
      <div className={ui.card}>
        <h1 className={ui.h1}>Available Experiments</h1>

        <p className="mt-2 text-sm text-zinc-600">
          Select an experiment to participate in.
        </p>

        {loading && <p className={ui.p}>Loading…</p>}
        {error && <p className={ui.error}>{error}</p>}

        {!loading && !error && items.length === 0 && (
          <div className="mt-6 rounded-md border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm text-zinc-700">
              No experiments are currently running.
            </p>
            <p className="mt-2 text-sm text-zinc-600">
              Please check back later.
            </p>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <ul className="mt-6 space-y-3">
            {items.map(exp => (
              <li key={exp.id}>
                <Link
                  href={`/run/${exp.id}`}
                  className="flex justify-between align-center rounded-md border border-zinc-200 px-4 py-3 transition hover:bg-zinc-50"
                >
                  <div>
                    <div className="font-medium text-zinc-900">
                      {exp.name}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500 font-mono">
                      {exp.id}
                    </div>
                  </div>

                  {exp.status && (
                    <div>
                      <div className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-700">
                        {exp.status}
                      </div>
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
