import { TasksView } from "@/components/tasks/tasks-view";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function TasksPage({ searchParams }: PageProps) {
  const { editTask } = await searchParams;
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <TasksView
        title="Tasks"
        editTaskId={typeof editTask === "string" ? editTask : undefined}
      />
    </div>
  );
}
