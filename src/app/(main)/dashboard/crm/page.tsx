import { RecentNotesCard } from "@/components/notes/recent-notes-card";
import { AssignedOpportunitiesCard } from "@/components/opportunities/assigned-opportunities-card";
import { DashboardTasksCard } from "@/components/tasks/dashboard-tasks-card";
import { MyWorkflowTasksCard } from "@/components/workflows/my-workflow-tasks-card";

export default async function CRMOverviewPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-6">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="space-y-6">
          <RecentNotesCard />
        </div>
        <div className="space-y-6">
          <DashboardTasksCard />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          <MyWorkflowTasksCard />
        </div>
        <div className="space-y-6">
          <AssignedOpportunitiesCard />
        </div>
      </div>
    </div>
  );
}
