import MetricsClient from "./ui";

type PageProps = {
  params: Promise<{ experimentId: string }>;
};

export default async function MetricsPage({ params }: PageProps) {
  const { experimentId } = await params;
  return <MetricsClient experimentId={experimentId} />;
}
