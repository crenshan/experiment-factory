import RunExperimentClient from "./ui";

type PageProps = {
  params: Promise<{ experimentId: string }>;
};

export default async function RunExperimentPage({ params }: PageProps) {
  const { experimentId } = await params;

  return <RunExperimentClient experimentId={experimentId} />;
}
