import { notFound } from "next/navigation";

import { getClient } from "@/actions/clients";
import type { Person } from "@/types/crm";

import { PersonalTab } from "../_components/tabs/personal-tab";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PersonalPage({ params }: Props) {
  const { id } = await params;
  const clientResult = await getClient(id);

  if (!clientResult.success || !clientResult.client) {
    notFound();
  }

  const person = clientResult.person as Person | null;

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {person ? (
        <PersonalTab person={person} />
      ) : (
        <p className="p-8 text-center text-muted-foreground italic">No person linked to this client.</p>
      )}
    </div>
  );
}
