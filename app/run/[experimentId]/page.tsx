type PageProps = {
  params: Promise<{ experimentId: string }>;
};

export default async function RunExperimentPage({ params }: PageProps) {
  const { experimentId } = await params;

  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>Runner</h1>
      <p>Experiment ID: {experimentId}</p>
      <p>Phase 4+ will load assignment and render a journey.</p>
    </main>
  );
}
