"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers";
import { fetchGraphQL } from "@/lib/graphql/fetchGraphQL";
import { createExperiment } from "@/server/data/experiments";

export default function NewExperimentPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [error, setError] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    try {
      setSaving(true);
      setError('');

      if (!user) throw new Error('Not signed in');

      const token = await user.getIdToken();
      const data = await fetchGraphQL<{createExperiment: { id: string }}, { input: { name: string } }>({
        token,
        query: /* GraphQL */ `
          mutation CreateExperiment($input: CreateExperimentInput!) {
            createExperiment(input: $input) {
              id
            }
          }
        `,
        variables: { input: { name: name.trim()  } },
      });

      router.push(`/admin/experiments/${data.createExperiment.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create experiment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif", maxWidth: 720 }}>
      <h1>New experiment</h1>

      <label style={{ display: "block", marginBottom: 8 }}>
        Name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
          placeholder="e.g., Home feed ranking test"
        />
      </label>

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

      <div style={{ display: "flex", gap: 12 }}>
        <button type="button" onClick={handleCreate} disabled={saving || name.trim().length < 3}>
          {saving ? "Creating…" : "Create"}
        </button>
        <a href="/admin/experiments">Cancel</a>
      </div>
    </main>
  );
}
