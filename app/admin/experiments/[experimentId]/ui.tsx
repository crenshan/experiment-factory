"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/app/providers";
import { fetchGraphQL } from "@/lib/graphql/fetchGraphQL";
import { ui } from "@/lib/ui";

type Experiment = {
  id: string;
  name: string;
  status: "DRAFT" | "RUNNING" | "PAUSED";
  updatedAt: string;
};

export default function EditExperimentClient({ experimentId }: { experimentId: string }) {
  const { user } = useAuth();

  const [exp, setExp] = useState<Experiment | null>(null);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Experiment["status"]>("DRAFT");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isDirty = useMemo(() => {
    if (!exp) return false;
    return name.trim() !== exp.name || status !== exp.status;
  }, [exp, name, status]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        if (!user) {
          setExp(null);
          setError("Not signed in");
          return;
        }

        const token = await user.getIdToken();
        const data = await fetchGraphQL<{ experiment: Experiment | null }, { id: string }>({
          token,
          query: /* GraphQL */ `
            query Experiment($id: ID!) {
              experiment(id: $id) {
                id
                name
                status
                updatedAt
              }
            }
          `,
          variables: { id: experimentId },
        });

        if (cancelled) return;

        if (!data.experiment) {
          setError("Experiment not found");
          setExp(null);
          return;
        }

        setExp(data.experiment);
        setName(data.experiment.name);
        setStatus(data.experiment.status);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load experiment");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user, experimentId]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");

      if (!user) throw new Error("Not signed in");

      const nextName = name.trim();
      if (nextName.length < 3) throw new Error("Name must be at least 3 characters");

      const token = await user.getIdToken();
      const data = await fetchGraphQL<
        { updateExperiment: Experiment },
        { id: string; patch: { name: string; status: Experiment["status"] } }
      >({
        token,
        query: /* GraphQL */ `
          mutation UpdateExperiment($id: ID!, $patch: UpdateExperimentPatch!) {
            updateExperiment(id: $id, patch: $patch) {
              id
              name
              status
              updatedAt
            }
          }
        `,
        variables: { id: experimentId, patch: { name: nextName, status } },
      });

      setExp(data.updateExperiment);
      setName(data.updateExperiment.name);
      setStatus(data.updateExperiment.status);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save experiment");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!exp) return;
    setName(exp.name);
    setStatus(exp.status);
    setError("");
  };

  if (loading) {
    return (
      <main className={ui.page}>
        <div className={ui.card}>
          <h1 className={ui.h1}>Edit experiment</h1>
          <p className={ui.p}>Loading…</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className={ui.page}>
        <div className={ui.card}>
          <h1 className={ui.h1}>Edit experiment</h1>
          <p className={ui.error}>{error}</p>
          <div className="mt-4">
            <Link className={ui.link} href="/admin/experiments">
              Back to experiments
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!exp) return null;

  return (
    <main className={ui.page}>
      <div className={ui.card}>
        <div className="flex items-center gap-3">
          <div>
            <h1 className={ui.h1}>Edit experiment</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Update the name and status. Variants/journeys come next.
            </p>
          </div>

          <div className="flex-1" />

          <Link className={ui.link} href={`/admin/experiments/${experimentId}/metrics`}>
            Metrics
          </Link>

          <Link className={ui.link} href="/admin/experiments">
            Back
          </Link>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-zinc-800">
              Name
              <input
                className={ui.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>

            <label className="mt-4 block text-sm font-medium text-zinc-800">
              Status
              <select
                className={ui.select}
                value={status}
                onChange={(e) => setStatus(e.target.value as Experiment["status"])}
              >
                <option value="DRAFT">DRAFT</option>
                <option value="RUNNING">RUNNING</option>
                <option value="PAUSED">PAUSED</option>
              </select>
            </label>

            {error ? <p className={`mt-3 ${ui.error}`}>{error}</p> : null}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className={ui.button.primary}
                onClick={handleSave}
                disabled={saving || name.trim().length < 3 || !isDirty}
              >
                {saving ? "Saving…" : "Save changes"}
              </button>

              <button
                type="button"
                className={ui.button.secondary}
                onClick={handleReset}
                disabled={saving || !isDirty}
              >
                Reset
              </button>

              <span className="text-xs text-zinc-500">
                Last updated: {new Date(exp.updatedAt).toLocaleString()}
              </span>
            </div>
          </div>

          <aside className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <h2 className="text-sm font-semibold text-zinc-900">Details</h2>

            <dl className="mt-3 grid gap-2 text-sm">
              <div className="flex gap-2">
                <dt className="w-24 font-medium text-zinc-800">ID</dt>
                <dd className="font-mono text-xs text-zinc-700">{exp.id}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 font-medium text-zinc-800">Status</dt>
                <dd className="text-zinc-700">{exp.status}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </div>
    </main>
  );
}
