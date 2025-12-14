'use client';

import { useEffect, useMemo, useState } from "react";
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

type Event = {
  id: string;
  type: "EXPOSURE" | "INTERACTION" | "CONVERSION";
  name: string;
  createdAt: string;
};

export default function RunExperimentClient({ experimentId }: { experimentId: string }) {
  const { user } = useAuth();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [logging, setLogging] = useState(false);
  const [lastEvent, setLastEvent] = useState<Event | null>(null);

  const tokenPromise = useMemo(() => (user ? user.getIdToken() : Promise.resolve(undefined)) , [user])

  // useEffect(() => {
  //   // ensure anon cookie exists before we hit GraphQL → server derives userKey
  //   ensureAnonId();
  // }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError('');

        ensureAnonId();

        const token = await tokenPromise;

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

        if (cancelled) return ;

        setAssignment(data.getAssignment);

         // Log exposure idempotently (once per userKey + experiment)
        const exposureKey = `exposure__${data.getAssignment.experimentId}__${data.getAssignment.userKey}`;

        setLogging(true);
        const exposure = await fetchGraphQL<{ logEvent: Event }, { input: unknown }>({
          token,
          query: /* GraphQL */ `
            mutation LogEvent($input: LogEventInput!) {
              logEvent(input: $input) {
                id
                type
                name
                createdAt
              }
            }
          `,
          variables: {
            input: {
              experimentId: data.getAssignment.experimentId,
              variantId: data.getAssignment.variant.id,
              type: "EXPOSURE",
              name: "runner_view",
              idempotencyKey: exposureKey,
            },
          },
        });

        if (!cancelled) setLastEvent(exposure.logEvent);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unexpected error');
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLogging(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    }
  }, [experimentId, setAssignment, tokenPromise, user]);

  const handleConvert = async () => {
    if (!assignment) return;

    try {
      setLogging(true);
      setError("");

      const token = await tokenPromise;
      const key = `conversion__${assignment.experimentId}__${assignment.userKey}__demo`;

      const res = await fetchGraphQL<{ logEvent: Event }, { input: unknown }>({
        token,
        query: /* GraphQL */ `
          mutation LogEvent($input: LogEventInput!) {
            logEvent(input: $input) {
              id
              type
              name
              createdAt
            }
          }
        `,
        variables: {
          input: {
            experimentId: assignment.experimentId,
            variantId: assignment.variant.id,
            type: "CONVERSION",
            name: "demo_conversion",
            idempotencyKey: key,
          },
        },
      });

      setLastEvent(res.logEvent);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to log conversion");
    } finally {
      setLogging(false);
    }
  };

  return (
     <main className={ui.page}>
      <div className={ui.card}>
        <div className="flex items-center gap-3">
          <div>
            <h1 className={ui.h1}>Runner</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Deterministic assignment + event logging for{" "}
              <span className="font-mono text-xs">{experimentId}</span>
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

          {!loading && assignment ? (
            <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <dl className="grid gap-3 text-sm">
                <div className="flex gap-2">
                  <dt className="w-28 font-medium text-zinc-800">Variant</dt>
                  <dd className="text-zinc-700">
                    <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-2 py-1 text-xs font-medium">
                      {assignment.variant.id}
                    </span>
                    <span className="ml-2">{assignment.variant.name}</span>
                  </dd>
                </div>

                <div className="flex gap-2">
                  <dt className="w-28 font-medium text-zinc-800">User key</dt>
                  <dd className="font-mono text-xs text-zinc-700">{assignment.userKey}</dd>
                </div>
              </dl>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className={ui.button.primary}
                  onClick={handleConvert}
                  disabled={logging}
                >
                  {logging ? "Working…" : "Simulate conversion"}
                </button>

                {lastEvent ? (
                  <span className="text-xs text-zinc-600">
                    Last event: <span className="font-medium">{lastEvent.type}</span> ({lastEvent.name})
                  </span>
                ) : (
                  <span className="text-xs text-zinc-500">No events logged yet.</span>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  )
}
