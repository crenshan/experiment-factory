"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/app/providers";
import { fetchGraphQL } from "@/lib/graphql/fetchGraphQL";
import { ui } from "@/lib/ui";

export default function NewExperimentPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [error, setError] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const canCreate = name.trim().length >= 3 && !saving;

  const handleCreate = async () => {
    try {
      setSaving(true);
      setError("");

      if (!user) throw new Error("Not signed in");

      const token = await user.getIdToken();
      const data = await fetchGraphQL<
        { createExperiment: { id: string } },
        { input: { name: string } }
      >({
        token,
        query: /* GraphQL */ `
          mutation CreateExperiment($input: CreateExperimentInput!) {
            createExperiment(input: $input) {
              id
            }
          }
        `,
        variables: { input: { name: name.trim() } },
      });

      router.push(`/admin/experiments/${data.createExperiment.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create experiment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className={ui.page}>
      <div className={ui.card}>
        <div className="flex items-center gap-3">
          <div>
            <h1 className={ui.h1}>New experiment</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Start with a simple experiment name. We’ll wire variants/journeys later.
            </p>
          </div>

          <div className="flex-1" />

          <Link className={ui.link} href="/admin/experiments">
            Back
          </Link>
        </div>

        <div className="mt-6 max-w-2xl">
          <label className="block text-sm font-medium text-zinc-800">
            Name
            <input
              className={ui.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Home feed ranking test"
              autoFocus
            />
          </label>

          {error ? <p className={`mt-3 ${ui.error}`}>{error}</p> : null}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button type="button" className={ui.button.primary} onClick={handleCreate} disabled={!canCreate}>
              {saving ? "Creating…" : "Create"}
            </button>

            <Link className={ui.button.secondary} href="/admin/experiments">
              Cancel
            </Link>

            <p className="text-xs text-zinc-500">
              Tip: keep names specific enough to map to a hypothesis.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
