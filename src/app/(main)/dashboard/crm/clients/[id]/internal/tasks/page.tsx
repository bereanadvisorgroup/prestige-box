import { TasksView } from "@/components/tasks/tasks-view";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientTasksPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className="py-4">
      <TasksView
        scope={{ clientId: id }}
        title="Tasks"
        description="Tasks associated with this client."
        useHeaderPortal={true}
      />
    </div>
  );
}
