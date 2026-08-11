import { NotesView } from "@/components/features/notes/notes-view";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientNotesPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className="py-4">
      <NotesView
        scope={{ clientId: id }}
        title="Notes"
        defaultAssociations={[{ entityType: "client", entityId: id }]}
        lockAssociations
        useHeaderPortal={true}
      />
    </div>
  );
}
