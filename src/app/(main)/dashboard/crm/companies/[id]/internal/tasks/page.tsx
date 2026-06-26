import { TasksView } from "@/components/tasks/tasks-view";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CompanyTasksPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className="flex flex-col gap-6 p-6">
      <TasksView scope={{ companyId: id }} title="Tasks" description="Tasks associated with this company." />
    </div>
  );
}
