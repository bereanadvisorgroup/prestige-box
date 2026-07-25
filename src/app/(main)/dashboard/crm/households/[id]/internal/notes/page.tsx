import { notFound } from "next/navigation";

import { getHouseholdActiveRollupClients } from "@/actions/households";
import { NotesView } from "@/components/notes/notes-view";

import { HouseholdHeaderPortal } from "../../_components/household-header-portal";

interface HouseholdNotesPageProps {
  params: Promise<{ id: string }>;
}

export default async function HouseholdNotesPage({ params }: HouseholdNotesPageProps) {
  const { id } = await params;
  const activeRes = await getHouseholdActiveRollupClients(id);

  if (!activeRes.success || !activeRes.household) {
    notFound();
  }

  const { clientIds } = activeRes;

  return (
    <div className="space-y-4 py-4">
      <HouseholdHeaderPortal sectionName="Notes" />
      <NotesView
        scope={{ clientIds }}
        title="Household Notes"
        defaultAssociations={clientIds.map((cId) => ({ entityType: "client", entityId: cId }))}
        useHeaderPortal={false}
      />
    </div>
  );
}
