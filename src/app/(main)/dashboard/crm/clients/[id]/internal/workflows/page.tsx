import { getWorkflows } from "@/actions/workflows";
import { WorkflowList } from "@/components/workflows/workflow-list";

interface WorkflowsPageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkflowsPage({ params }: WorkflowsPageProps) {
  const { id } = await params;
  const result = await getWorkflows("client", id);
  const workflows = result.success && result.workflows ? result.workflows : [];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <WorkflowList entityType="client" entityId={id} workflows={workflows} />
    </div>
  );
}
