import { notFound } from "next/navigation";

import { getPerson } from "@/actions/people";
import { NotesView } from "@/components/features/notes/notes-view";

import { PersonHeaderPortal } from "../_components/person-header-portal";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PersonNotesPage({ params }: Props) {
  const { id } = await params;
  const personRes = await getPerson(id);

  if (!personRes.success || !personRes.person) {
    notFound();
  }

  return (
    <div className="py-4">
      <PersonHeaderPortal sectionName="Notes" />
      <div className="overflow-hidden rounded-xl border bg-background/50 p-6 shadow-sm backdrop-blur-sm">
        <NotesView
          scope={{ personId: id }}
          title="Notes"
          defaultAssociations={[{ entityType: "person", entityId: id }]}
          lockAssociations
          useHeaderPortal={false}
        />
      </div>
    </div>
  );
}
