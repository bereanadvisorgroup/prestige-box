import { notFound } from "next/navigation";

import { getPerson } from "@/actions/people";
import { TasksView } from "@/components/features/tasks/tasks-view";

import { PersonHeaderPortal } from "../_components/person-header-portal";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PersonTasksPage({ params }: Props) {
  const { id } = await params;
  const personRes = await getPerson(id);

  if (!personRes.success || !personRes.person) {
    notFound();
  }

  return (
    <div className="py-4">
      <PersonHeaderPortal sectionName="Tasks" />
      <div className="overflow-hidden rounded-xl border bg-background/50 p-6 shadow-sm backdrop-blur-sm">
        <TasksView scope={{ personId: id }} title="Tasks" useHeaderPortal={false} />
      </div>
    </div>
  );
}
