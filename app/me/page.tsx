"use client";

import { useState } from "react";
import { useAuth } from "../providers";

export default function MePage() {
  const { user, loading, isAdmin } = useAuth();
  const [token, setToken] = useState<string>("");

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
      <main style={{ padding: 24 }}>
        <h1>Me</h1>
        <p>Loading…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Me</h1>
        <p>You are not signed in.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Me</h1>
      <ul>
        <li><strong>UID:</strong> {user.uid}</li>
        <li><strong>Email:</strong> {user.email ?? "—"}</li>
        <li><strong>Admin:</strong> {isAdmin ? "Yes" : "No"}</li>
      </ul>

      <hr style={{ margin: "24px 0" }} />

      <h2 style={{ marginBottom: 8 }}>GraphQL testing</h2>
      <p style={{ marginTop: 0, maxWidth: 720 }}>
        Click “Get ID Token”, then use it in GraphiQL as an Authorization header:
        <code style={{ display: "block", marginTop: 8 }}>
          {"{ \"Authorization\": \"Bearer YOUR_TOKEN\" }"}
        </code>
      </p>

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <button type="button" onClick={handleGetToken}>
          Get ID Token
        </button>
        <button type="button" onClick={handleCopy} disabled={!token}>
          Copy Token
        </button>
      </div>

      {token ? (
        <textarea
          readOnly
          value={token}
          style={{ width: "100%", minHeight: 140, fontFamily: "monospace" }}
        />
      ) : (
        <p>No token fetched yet.</p>
      )}
    </main>
  );
}
