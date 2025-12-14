"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/app/providers";
import { fetchGraphQL } from "@/lib/graphql/fetchGraphQL";
import { ui } from "@/lib/ui";

type Metrics = {
  experimentId: string;
  generatedAt: string;
  variants: Array<{
    variantId: string;
    variantName: string;
    exposures: number;
    conversions: number;
    conversionRate: number;
  }>;
  totals: {
    exposures: number;
    conversions: number;
    conversionRate: number;
  };
};

export default function MetricsClient({ experimentId }: { experimentId: string }) {
  const { user } = useAuth();
  const [data, setData] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");

      if (!user) throw new Error("Not signed in");

      const token = await user.getIdToken();
      const res = await fetchGraphQL<{ experimentMetrics: Metrics }, { experimentId: string }>({
        token,
        query: /* GraphQL */ `
          query Metrics($experimentId: ID!) {
            experimentMetrics(experimentId: $experimentId) {
              experimentId
              generatedAt
              totals {
                exposures
                conversions
                conversionRate
              }
              variants {
                variantId
                variantName
                exposures
                conversions
                conversionRate
              }
            }
          }
        `,
        variables: { experimentId },
      });

      setData(res.experimentMetrics);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load metrics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experimentId, user]);

  return (
    <main className={ui.page}>
      <div className={ui.card}>
        <div className="flex items-center gap-3">
          <div>
            <h1 className={ui.h1}>Metrics</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Experiment: <span className="font-mono text-xs">{experimentId}</span>
            </p>
          </div>

          <div className="flex-1" />

          <button type="button" className={ui.button.secondary} onClick={load} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>

          <Link className={ui.link} href={`/admin/experiments/${experimentId}`}>
            Back
          </Link>
        </div>

        <div className="mt-6">
          {loading ? <p className={ui.p}>Loading…</p> : null}
          {error ? <p className={ui.error}>{error}</p> : null}

          {!loading && data ? (
            <>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm">
                <div className="flex flex-wrap gap-6">
                  <div>
                    <div className="text-xs text-zinc-500">Exposures</div>
                    <div className="text-lg font-semibold text-zinc-900">{data.totals.exposures}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500">Conversions</div>
                    <div className="text-lg font-semibold text-zinc-900">{data.totals.conversions}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500">Conversion rate</div>
                    <div className="text-lg font-semibold text-zinc-900">
                      {(data.totals.conversionRate * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="ml-auto text-xs text-zinc-500">
                    Generated: {new Date(data.generatedAt).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className={`${ui.table.wrap} mt-4`}>
                <table className={ui.table.table}>
                  <thead>
                    <tr>
                      <th className={ui.table.th}>Variant</th>
                      <th className={ui.table.th}>Exposures</th>
                      <th className={ui.table.th}>Conversions</th>
                      <th className={ui.table.th}>Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.variants.map((v) => (
                      <tr key={v.variantId} className="hover:bg-zinc-50">
                        <td className={ui.table.td}>
                          <div className="font-medium text-zinc-900">{v.variantName}</div>
                          <div className="mt-1 font-mono text-xs text-zinc-500">{v.variantId}</div>
                        </td>
                        <td className={ui.table.td}>{v.exposures}</td>
                        <td className={ui.table.td}>{v.conversions}</td>
                        <td className={ui.table.td}>{(v.conversionRate * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
