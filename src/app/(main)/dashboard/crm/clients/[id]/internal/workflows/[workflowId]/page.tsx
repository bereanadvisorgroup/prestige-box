import { notFound } from "next/navigation";

import { getWorkflow } from "@/actions/workflows";
import { WorkflowDetail } from "@/components/workflows/workflow-detail";

interface WorkflowPageProps {
  params: Promise<{ id: string; workflowId: string }>;
}

export default async function WorkflowPage({ params }: WorkflowPageProps) {
  const { id, workflowId } = await params;
  const result = await getWorkflow(workflowId);

  if (!result.success || !result.workflow) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 md:px-6">
      <WorkflowDetail entityType="client" entityId={id} workflow={result.workflow} />
    </div>
  );
}
