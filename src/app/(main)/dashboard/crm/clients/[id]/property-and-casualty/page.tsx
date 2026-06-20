import { notFound } from "next/navigation";

import { getClient } from "@/actions/clients";
import { getPropertyAndCasualtyFirms } from "@/actions/property-and-casualty";

import { PropertyAndCasualtyManager } from "./_components/property-and-casualty-manager";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PropertyAndCasualtyPage({ params }: Props) {
  const { id } = await params;
  const clientResult = await getClient(id);

  if (!clientResult.success || !clientResult.client) {
    notFound();
  }

  const client = clientResult.client;
  const propertyAndCasualtyFirmsRes = await getPropertyAndCasualtyFirms();
  const allFirms = (propertyAndCasualtyFirmsRes.success && propertyAndCasualtyFirmsRes.propertyAndCasualtyFirms) || [];

  return (
    <div className="bg-muted/5 p-4 md:p-6 lg:p-8">
      <PropertyAndCasualtyManager client={client} allFirms={allFirms} />
    </div>
  );
}
