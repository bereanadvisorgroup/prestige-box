import { TasksView } from "@/components/features/tasks/tasks-view";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CompanyTasksPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { editTask } = await searchParams;
  return (
    <div className="flex flex-col gap-6 p-6">
      <TasksView
        scope={{ companyId: id }}
        title="Tasks"
        description="Tasks associated with this company."
        useHeaderPortal={true}
        editTaskId={typeof editTask === "string" ? editTask : undefined}
      />
    </div>
  );
}
