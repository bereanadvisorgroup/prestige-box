import { notFound } from "next/navigation";

import { getClient } from "@/actions/clients";

import { FamilyTab } from "../_components/tabs/family-tab";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FamilyPage({ params }: Props) {
  const { id } = await params;
  const clientResult = await getClient(id);

  if (!clientResult.success || !clientResult.client) {
    notFound();
  }

  const client = clientResult.client;

  return (
    <div className="py-4">
      <FamilyTab client={client} />
    </div>
  );
}
