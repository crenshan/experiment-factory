'use client';

import { useEffect, useState } from "react";
import Link from 'next/link'

import { ensureAnonId } from "@/lib/anon";
import { useAuth } from "@/app/providers";
import { fetchGraphQL } from "@/lib/graphql/fetchGraphQL";
import { ui } from "@/lib/ui";

type Assignment = {
  experimentId: string;
  userKey: string;
  assignedAt: string;
  variant: {
    id: string;
    name: string;
    weight: number;
    journeyId?: string | null;
  }
};

export default function RunExperimentClient({ experimentId }: { experimentId: string }) {
  const { user } = useAuth();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ensure anon cookie exists before we hit GraphQL → server derives userKey
    ensureAnonId();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const token = user ? await user.getIdToken() : undefined;

        const data = await fetchGraphQL<
          { getAssignment: Assignment },
          { experimentId: string }
        >({
          token,
          query: /* GraphQL */ `
            query GetAssignment($experimentId: ID!) {
              getAssignment(experimentId: $experimentId) {
                experimentId
                userKey
                assignedAt
                variant {
                  id
                  name
                  weight
                  journeyId
                }
              }
            }
          `,
          variables: { experimentId }
        });

        if (!cancelled) setAssignment(data.getAssignment);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load assignment');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    }
  }, [experimentId, setAssignment, user]);

  return (
     <main className={ui.page}>
      <div className={ui.card}>
        <div className="flex items-center gap-3">
          <div>
            <h1 className={ui.h1}>Runner</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Deterministic assignment for <span className="font-mono text-xs">{experimentId}</span>
            </p>
          </div>

          <div className="flex-1" />

          <Link className={ui.link} href="/">
            Home
          </Link>
        </div>

        <div className="mt-6">
          {loading ? <p className={ui.p}>Assigning…</p> : null}
          {error ? <p className={ui.error}>{error}</p> : null}

          {!loading && !error && assignment ? (
            <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <dl className="grid gap-3 text-sm">
                <div className="flex gap-2">
                  <dt className="w-28 font-medium text-zinc-800">Variant</dt>
                  <dd className="text-zinc-700">
                    <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-2 py-1 text-xs font-medium">
                      {assignment.variant.id}
                    </span>{" "}
                    <span className="ml-2">{assignment.variant.name}</span>
                  </dd>
                </div>

                <div className="flex gap-2">
                  <dt className="w-28 font-medium text-zinc-800">Weight</dt>
                  <dd className="text-zinc-700">{assignment.variant.weight}</dd>
                </div>

                <div className="flex gap-2">
                  <dt className="w-28 font-medium text-zinc-800">Assigned</dt>
                  <dd className="text-zinc-700">{new Date(assignment.assignedAt).toLocaleString()}</dd>
                </div>

                <div className="flex gap-2">
                  <dt className="w-28 font-medium text-zinc-800">User key</dt>
                  <dd className="font-mono text-xs text-zinc-700">{assignment.userKey}</dd>
                </div>
              </dl>

              <p className="mt-4 text-xs text-zinc-600">
                Refresh this page: you should keep the same variant for the same userKey.
                Open in an incognito window: you should usually get a different assignment.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  )
}
