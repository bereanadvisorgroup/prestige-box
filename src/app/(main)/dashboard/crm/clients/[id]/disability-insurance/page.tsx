import { notFound } from "next/navigation";

import { getClient } from "@/actions/clients";
import { getDisabilityInsuranceCompanies } from "@/actions/disability-insurance-companies";

import { DisabilityInsuranceManager } from "./_components/disability-insurance-manager";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DisabilityInsurancePage({ params }: Props) {
  const { id } = await params;
  const clientResult = await getClient(id);

  if (!clientResult.success || !clientResult.client) {
    notFound();
  }

  const client = clientResult.client;
  const companiesRes = await getDisabilityInsuranceCompanies();
  const allCompanies = (companiesRes.success && companiesRes.companies) || [];

  return (
    <div className="py-4">
      <DisabilityInsuranceManager client={client} allCompanies={allCompanies} />
    </div>
  );
}
