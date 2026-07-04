import { notFound } from "next/navigation";

import { getClientAssetHistory } from "@/actions/assets";
import { getClient } from "@/actions/clients";
import { getPerson } from "@/actions/people";

import { ClientHeaderPortal } from "./_components/client-header-portal";
import { ContactCard } from "./_components/contact-card";
import { NetWorthGraph } from "./_components/net-worth-graph";
import { PersonalInfoCard } from "./_components/personal-info-card";

interface ClientPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ClientPage({ params }: ClientPageProps) {
  const { id } = await params;
  const clientResult = await getClient(id);

  if (!clientResult.success || !clientResult.client) {
    notFound();
  }

  const client = clientResult.client;

  // Fetch only the entities required for the General page
  const [historyResult, personResult] = await Promise.all([getClientAssetHistory(id), getPerson(client.personId)]);

  const historyData = historyResult.success && historyResult.historyData ? historyResult.historyData : [];
  const person = personResult.success && personResult.person ? personResult.person : null;

  return (
    <div className="py-4">
      <ClientHeaderPortal sectionName="Overview" />
      <div className="flex flex-col gap-8">
        {person && (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <ContactCard person={person} />
            <PersonalInfoCard person={person} clientId={id} />
          </div>
        )}
        <NetWorthGraph historyData={historyData} />
      </div>
    </div>
  );
}
