import { notFound } from "next/navigation";

import { getHouseholdActiveRollupClients } from "@/actions/households";
import { getWorkflows } from "@/actions/workflows";
import { WorkflowList } from "@/components/workflows/workflow-list";

import { HouseholdHeaderPortal } from "../../_components/household-header-portal";

interface WorkflowsPageProps {
  params: Promise<{ id: string }>;
}

export default async function HouseholdWorkflowsPage({ params }: WorkflowsPageProps) {
  const { id } = await params;
  const activeRes = await getHouseholdActiveRollupClients(id);

  if (!activeRes.success || !activeRes.household) {
    notFound();
  }

  const { clientIds } = activeRes;

  const result = await getWorkflows("client", clientIds);
  const workflows = result.success && result.workflows ? result.workflows : [];

  return (
    <div className="space-y-4 py-4">
      <HouseholdHeaderPortal sectionName="Workflows" />
      <div className="mx-auto w-full max-w-6xl">
        <WorkflowList entityType="client" entityId={clientIds[0] || id} workflows={workflows} />
      </div>
    </div>
  );
}
