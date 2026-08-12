import { notFound } from "next/navigation";

import { getClient } from "@/actions/clients";
import { getInsuranceAgencies } from "@/actions/insurance-agencies";
import { getPropertyAndCasualtyFirms } from "@/actions/property-and-casualty";

import { PropertyAndCasualtyManager } from "./_components/property-and-casualty-manager";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PropertyAndCasualtyPage({ params }: Props) {
  const { id } = await params;
  const [clientResult, propertyAndCasualtyFirmsRes, agenciesRes] = await Promise.all([
    getClient(id),
    getPropertyAndCasualtyFirms(),
    getInsuranceAgencies(),
  ]);

  if (!clientResult.success || !clientResult.client) {
    notFound();
  }

  const client = clientResult.client;
  const allFirms = (propertyAndCasualtyFirmsRes.success && propertyAndCasualtyFirmsRes.propertyAndCasualtyFirms) || [];
  const insuranceAgencies = (agenciesRes.success && agenciesRes.insuranceAgencies) || [];

  return (
    <div className="py-4">
      <PropertyAndCasualtyManager client={client} allFirms={allFirms} insuranceAgencies={insuranceAgencies} />
    </div>
  );
}
