import { notFound } from "next/navigation";

import { getClient } from "@/actions/clients";
import type { Person } from "@/types/crm";

import { LiabilitiesTab } from "../_components/tabs/liabilities-tab";
import { MortgageTab } from "../_components/tabs/mortgage-tab";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LiabilitiesPage({ params }: Props) {
  const { id } = await params;
  const clientResult = await getClient(id);

  if (!clientResult.success || !clientResult.client) {
    notFound();
  }

  const client = clientResult.client;
  const person = clientResult.person as Person | null;

  return (
    <div className="space-y-8 bg-muted/5 p-4 md:p-6 lg:p-8">
      <LiabilitiesTab client={client} />
      {person && <MortgageTab client={client} person={person} />}
    </div>
  );
}
