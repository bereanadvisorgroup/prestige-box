import { notFound } from "next/navigation";

import { getClient } from "@/actions/clients";
import type { Person } from "@/types/crm";

import { ClientProfileTabs } from "../_components/client-profile-tabs";

interface EditClientPageProps {
  params: {
    id: string;
  };
}

export default async function EditClientPage({ params }: EditClientPageProps) {
  const { id } = await params;
  const result = await getClient(id);

  if (!result.success || !result.client) {
    notFound();
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4 md:px-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2 mb-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Edit Client Profile</h1>
        <p className="text-muted-foreground">Modify client preferences, personal details, family, and documentation.</p>
      </div>

      <ClientProfileTabs client={result.client} person={result.person as Person | null} />
    </div>
  );
}
