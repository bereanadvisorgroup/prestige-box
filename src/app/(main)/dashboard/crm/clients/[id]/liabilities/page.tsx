import { notFound } from "next/navigation";

import { getAssets } from "@/actions/assets";
import { getBanks } from "@/actions/banks";
import { getClient } from "@/actions/clients";

import { LiabilitiesTab } from "../_components/tabs/liabilities-tab";

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

  const [banksRes, assetsRes] = await Promise.all([getBanks(), getAssets(id)]);

  const allBanks = (banksRes.success && banksRes.banks) || [];
  const associatedBanks = allBanks.filter((b) => b.clientIds?.includes(client.id || ""));
  const clientAssets = (assetsRes.success && assetsRes.assets) || [];

  return (
    <div className="space-y-8 bg-muted/5 p-4 md:p-6 lg:p-8">
      <LiabilitiesTab client={client} associatedBanks={associatedBanks} clientAssets={clientAssets} />
    </div>
  );
}
