"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/providers";
import { fetchGraphQL } from "@/lib/graphql/fetchGraphQL";

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

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        if (!user) return;

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

      const token = await user.getIdToken();
      const data = await fetchGraphQL<{ updateExperiment: Experiment }, { id: string; patch: { name: string; status: Experiment["status"] } }>({
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
        variables: { id: experimentId, patch: { name: name.trim(), status } },
      });

      setExp(data.updateExperiment);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save experiment");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
        <h1>Edit experiment</h1>
        <p>Loading…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
        <h1>Edit experiment</h1>
        <p style={{ color: "crimson" }}>{error}</p>
        <p>
          <a href="/admin/experiments">Back to list</a>
        </p>
      </main>
    );
  }

  if (!exp) return null;

  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif", maxWidth: 720 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Edit experiment</h1>
        <span style={{ flex: 1 }} />
        <a href="/admin/experiments">Back</a>
      </div>

      <p style={{ color: "#555" }}>
        ID: <code>{exp.id}</code>
      </p>

      <label style={{ display: "block", marginBottom: 12 }}>
        Name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
        />
      </label>

      <label style={{ display: "block", marginBottom: 12 }}>
        Status
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Experiment["status"])}
          style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
        >
          <option value="DRAFT">DRAFT</option>
          <option value="RUNNING">RUNNING</option>
          <option value="PAUSED">PAUSED</option>
        </select>
      </label>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button type="button" onClick={handleSave} disabled={saving || name.trim().length < 3}>
          {saving ? "Saving…" : "Save"}
        </button>

        <span style={{ color: "#666" }}>
          Last updated: {new Date(exp.updatedAt).toLocaleString()}
        </span>
      </div>
    </main>
  );
}
