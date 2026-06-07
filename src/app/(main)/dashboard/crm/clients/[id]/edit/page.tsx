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
    <div className="fade-in mx-auto w-full max-w-7xl animate-in space-y-8 px-4 py-8 duration-500 md:px-6">
      <div className="mb-4 flex flex-col gap-2">
        <h1 className="font-bold text-3xl text-foreground tracking-tight">Edit Client Profile</h1>
        <p className="text-muted-foreground">Modify client preferences, personal details, family, and documentation.</p>
      </div>

      <ClientProfileTabs client={result.client} person={result.person as Person | null} />
    </div>
  );
}
