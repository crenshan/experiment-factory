"use client";

import { useState } from "react";
import { useAuth } from "@/app/providers";
import { ui } from "@/lib/ui";

export default function MePage() {
  const { user, loading, isAdmin } = useAuth();
  const [token, setToken] = useState("");

  const handleGetToken = async () => {
    if (!user) return;
    const t = await user.getIdToken();
    setToken(t);
  };

  const handleCopy = async () => {
    if (!token) return;
    await navigator.clipboard.writeText(token);
  };

  if (loading) {
    return (
      <main className={ui.page}>
        <div className={ui.card}>
          <h1 className={ui.h1}>Me</h1>
          <p className={ui.p}>Loading…</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className={ui.page}>
        <div className={ui.card}>
          <h1 className={ui.h1}>Me</h1>
          <p className={ui.p}>You are not signed in.</p>
        </div>
      </main>
    );
  }

  return (
    <main className={ui.page}>
      <div className={ui.card}>
        <h1 className={ui.h1}>Me</h1>

        <dl className="mt-4 grid gap-3 text-sm">
          <div className="flex gap-2">
            <dt className="w-24 font-medium text-zinc-800">UID</dt>
            <dd className="text-zinc-700">{user.uid}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-24 font-medium text-zinc-800">Email</dt>
            <dd className="text-zinc-700">{user.email ?? "—"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-24 font-medium text-zinc-800">Admin</dt>
            <dd className="text-zinc-700">{isAdmin ? "Yes" : "No"}</dd>
          </div>
        </dl>

        <hr className={ui.hr} />

        <h2 className={ui.h2}>GraphQL testing</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Get an ID token and use it in GraphiQL headers as:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-md bg-zinc-50 p-3 text-xs text-zinc-800">
          {`{ "authorization": "Bearer YOUR_TOKEN" }`}
        </pre>

        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" className={ui.button.primary} onClick={handleGetToken}>
            Get ID Token
          </button>
          <button type="button" className={ui.button.secondary} onClick={handleCopy} disabled={!token}>
            Copy Token
          </button>
        </div>

        {token ? (
          <textarea
            readOnly
            value={token}
            className="mt-4 w-full rounded-md border border-zinc-300 bg-white p-3 font-mono text-xs"
            rows={6}
          />
        ) : (
          <p className="mt-4 text-sm text-zinc-600">No token fetched yet.</p>
        )}
      </div>
    </main>
  );
}
