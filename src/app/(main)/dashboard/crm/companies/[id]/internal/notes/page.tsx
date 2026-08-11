import { NotesView } from "@/components/features/notes/notes-view";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CompanyNotesPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className="flex flex-col gap-6 p-6">
      <NotesView
        scope={{ companyId: id }}
        title="Notes"
        defaultAssociations={[{ entityType: "company", entityId: id }]}
        lockAssociations
        useHeaderPortal={true}
      />
    </div>
  );
}
