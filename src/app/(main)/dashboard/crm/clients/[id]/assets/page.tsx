import { notFound } from "next/navigation";

import type { Metadata } from "next";

import { getAddresses } from "@/actions/addresses";
import { getAssets, getClientAssetHistory } from "@/actions/assets";
import { getClient } from "@/actions/clients";

import { AssetsTab } from "../_components/tabs/assets-tab";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Assets | Prestige Box",
  description: "Manage client real estate properties, vehicles, collectibles, and fixed physical assets.",
};

export default async function ClientAssetsPage({ params }: Props) {
  const { id } = await params;
  const clientResult = await getClient(id);

  if (!clientResult.success || !clientResult.client) {
    notFound();
  }

  const client = clientResult.client;

  // Fetch client assets, history data, and all addresses
  const [assetsResult, historyResult, addressesResult] = await Promise.all([
    getAssets(id),
    getClientAssetHistory(id),
    getAddresses(),
  ]);

  const initialAssets = assetsResult.success && assetsResult.assets ? assetsResult.assets : [];
  const initialHistoryData = historyResult.success && historyResult.historyData ? historyResult.historyData : [];
  const initialAddresses = addressesResult.success && addressesResult.addresses ? addressesResult.addresses : [];

  return (
    <div className="py-4">
      <AssetsTab
        client={client}
        initialAssets={initialAssets}
        initialHistoryData={initialHistoryData}
        initialAddresses={initialAddresses}
      />
    </div>
  );
}
