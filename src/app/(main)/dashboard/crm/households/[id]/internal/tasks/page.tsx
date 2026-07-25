import { notFound } from "next/navigation";

import { getHouseholdActiveRollupClients } from "@/actions/households";
import { TasksView } from "@/components/tasks/tasks-view";

import { HouseholdHeaderPortal } from "../../_components/household-header-portal";

interface HouseholdTasksPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function HouseholdTasksPage({ params, searchParams }: HouseholdTasksPageProps) {
  const { id } = await params;
  const { editTask } = await searchParams;
  const activeRes = await getHouseholdActiveRollupClients(id);

  if (!activeRes.success || !activeRes.household) {
    notFound();
  }

  const { clientIds } = activeRes;

  return (
    <div className="space-y-4 py-4">
      <HouseholdHeaderPortal sectionName="Tasks" />
      <TasksView
        scope={{ clientIds }}
        title="Household Tasks"
        description="Tasks associated with household members in active financial rollup."
        useHeaderPortal={false}
        editTaskId={typeof editTask === "string" ? editTask : undefined}
      />
    </div>
  );
}
