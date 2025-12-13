

export default function Home() {
   return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ marginBottom: 8 }}>Experiment Factory</h1>
      <p style={{ marginTop: 0, maxWidth: 720 }}>
        A Next.js + Firebase prototyping platform with deterministic A/B assignment and event logging.
      </p>

      <ul>
        <li>
          <a href="/health">Health check</a>
        </li>
        <li>
          <a href="/admin">Admin (coming soon)</a>
        </li>
        <li>
          <a href="/run/demo">Runner (coming soon)</a>
        </li>
      </ul>
    </main>
  );
}
