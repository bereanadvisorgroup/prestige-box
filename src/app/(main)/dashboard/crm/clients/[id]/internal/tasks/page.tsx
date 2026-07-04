import { TasksView } from "@/components/tasks/tasks-view";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ClientTasksPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { editTask } = await searchParams;
  return (
    <div className="py-4">
      <TasksView
        scope={{ clientId: id }}
        title="Tasks"
        description="Tasks associated with this client."
        useHeaderPortal={true}
        editTaskId={typeof editTask === "string" ? editTask : undefined}
      />
    </div>
  );
}
