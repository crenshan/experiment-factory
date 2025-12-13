"use client";

import { useAuth } from "../providers";

export default function MePage() {
  const { user, loading, isAdmin } = useAuth();

  if(loading) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Me</h1>
        <p>Loading...</p>
      </main>
    )
  }

  if (!user) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Me</h1>
        <p>You are not signed in.</p>
      </main>
    )
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Me</h1>

      <ul>
        <li><strong>UID:</strong> {user.uid}</li>
        <li><strong>Email:</strong> {user.email ?? "—"}</li>
        <li><strong>Admin:</strong> {isAdmin ? "Yes" : "No"}</li>
      </ul>
    </main>
  )
}
