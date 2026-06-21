import { notFound } from "next/navigation";

import { getClient } from "@/actions/clients";
import { getLongTermCareInsurances } from "@/actions/long-term-care-insurance";

import { LongTermCareManager } from "./_components/long-term-care-manager";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LongTermCarePage({ params }: Props) {
  const { id } = await params;
  const clientResult = await getClient(id);

  if (!clientResult.success || !clientResult.client) {
    notFound();
  }

  const client = clientResult.client;
  const companiesRes = await getLongTermCareInsurances();
  const allCompanies = (companiesRes.success && companiesRes.companies) || [];

  return (
    <div className="bg-muted/5 p-4 md:p-6 lg:p-8">
      <LongTermCareManager client={client} allCompanies={allCompanies} />
    </div>
  );
}
