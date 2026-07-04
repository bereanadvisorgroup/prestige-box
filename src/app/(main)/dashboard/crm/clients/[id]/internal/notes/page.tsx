import { NotesView } from "@/components/notes/notes-view";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientNotesPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className="flex flex-col gap-6 p-6">
      <NotesView
        scope={{ clientId: id }}
        title="Notes"
        defaultAssociations={[{ entityType: "client", entityId: id }]}
        lockAssociations
      />
    </div>
  );
}
