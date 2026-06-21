import { notFound } from "next/navigation";

import { getClient } from "@/actions/clients";
import { getLifeInsuranceCompanies } from "@/actions/life-insurance-companies";

import { LifeInsuranceManager } from "./_components/life-insurance-manager";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LifeInsurancePage({ params }: Props) {
  const { id } = await params;
  const clientResult = await getClient(id);

  if (!clientResult.success || !clientResult.client) {
    notFound();
  }

  const client = clientResult.client;
  const companiesRes = await getLifeInsuranceCompanies();
  const allCompanies = (companiesRes.success && companiesRes.companies) || [];

  return (
    <div className="bg-muted/5 p-4 md:p-6 lg:p-8">
      <LifeInsuranceManager client={client} allCompanies={allCompanies} />
    </div>
  );
}
