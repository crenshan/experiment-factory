import EditExperimentClient from "./ui";

type PageProps = {
  params: Promise<{ experimentId: string }>;
};

export default async function EditExperimentPage({ params }: PageProps) {
  const { experimentId } = await params;
  return <EditExperimentClient experimentId={experimentId} />;
}
