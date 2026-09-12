import { notFound } from "next/navigation";

import { getAddress } from "@/actions/addresses";
import { getClientAssetHistory } from "@/actions/assets";
import { getClient } from "@/actions/clients";
import { getPerson } from "@/actions/people";
import type { Address } from "@/types/crm";

import { ClientHeaderPortal } from "../_components/client-header-portal";
import { ContactCard } from "../_components/contact-card";
import { NetWorthGraph } from "../_components/net-worth-graph";
import { PersonalInfoCard } from "../_components/personal-info-card";

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

  let addresses: Address[] = [];
  if (person) {
    const addressIds = person.addressIds?.length
      ? person.addressIds
      : (person.addresses || []).map((a) => a.id).filter(Boolean);
    if (addressIds.length > 0) {
      const addressResults = await Promise.all(addressIds.map((addrId) => getAddress(addrId)));
      addresses = addressResults
        .map((res) => (res.success && res.address ? res.address : null))
        .filter(Boolean) as Address[];
    }
  }

  return (
    <div className="py-4">
      <ClientHeaderPortal sectionName="Overview" />
      <div className="flex flex-col gap-8">
        {person && (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <ContactCard person={person} addresses={addresses} />
            <PersonalInfoCard client={client} />
          </div>
        )}
        <NetWorthGraph historyData={historyData} />
      </div>
    </div>
  );
}
