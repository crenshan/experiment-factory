"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/providers";
import { fetchGraphQL } from "@/lib/graphql/fetchGraphQL";

type Experiment = {
  id: string;
  name: string;
  status: 'DRAFT' |  'RUNNING' | 'PAUSED';
  updatedAt: string;
}

export default function ExperimentListPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Experiment[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError('');

        if (!user) return;

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
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load experiments');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    }
  }, [user]);

  return (
        <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Experiments</h1>
        <span style={{ flex: 1 }} />
        <a href="/admin/experiments/new">New experiment</a>
      </div>

      {loading ? <p>Loading…</p> : null}
      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

      {!loading && !error && items.length === 0 ? <p>No experiments yet.</p> : null}

      {!loading && !error && items.length > 0 ? (
        <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Name</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Status</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Updated</th>
            </tr>
          </thead>
          <tbody>
            {items.map((exp) => (
              <tr key={exp.id}>
                <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>
                  <a href={`/admin/experiments/${exp.id}`}>{exp.name}</a>
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>{exp.status}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>
                  {new Date(exp.updatedAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </main>
  )
}
