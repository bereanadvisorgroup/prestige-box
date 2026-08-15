import { notFound } from "next/navigation";

import { Home } from "lucide-react";

import { getAddresses } from "@/actions/addresses";
import { getAssets, getClientAssetHistory } from "@/actions/assets";
import { getClients } from "@/actions/clients";
import { getHouseholdActiveRollupClients } from "@/actions/households";
import { AssetsTab } from "@/app/(main)/dashboard/crm/clients/[id]/_components/tabs/assets-tab";
import { Card, CardContent } from "@/components/ui/card";
import { formatPersonName } from "@/lib/utils";

import { HouseholdHeaderPortal } from "../_components/household-header-portal";

interface HouseholdAssetsPageProps {
  params: Promise<{ id: string }>;
}

export default async function HouseholdAssetsPage({ params }: HouseholdAssetsPageProps) {
  const { id } = await params;
  const activeRes = await getHouseholdActiveRollupClients(id);

  if (!activeRes.success || !activeRes.household) {
    notFound();
  }

  const { clientIds } = activeRes;

  const [allClientsRes, addressesResult] = await Promise.all([getClients(), getAddresses()]);

  const allClients = allClientsRes.success ? allClientsRes.clients || [] : [];
  const activeClients = allClients.filter((c) => clientIds.includes(c.id || ""));
  const initialAddresses = addressesResult.success && addressesResult.addresses ? addressesResult.addresses : [];

  const clientAssetData = await Promise.all(
    activeClients.map(async (client) => {
      const [assetsResult, historyResult] = await Promise.all([
        getAssets(client.id || ""),
        getClientAssetHistory(client.id || ""),
      ]);
      return {
        client,
        assets: assetsResult.success && assetsResult.assets ? assetsResult.assets : [],
        historyData: historyResult.success && historyResult.historyData ? historyResult.historyData : [],
      };
    }),
  );

  return (
    <div className="space-y-6 py-4">
      <HouseholdHeaderPortal sectionName="Assets" />
      {clientAssetData.length > 0 ? (
        clientAssetData.map(({ client, assets, historyData }) => (
          <div key={client.id} className="space-y-2">
            <h3 className="font-semibold text-muted-foreground text-sm uppercase tracking-wider">
              Client: {formatPersonName(client.person, client.id)}
            </h3>
            <AssetsTab
              client={client}
              initialAssets={assets}
              initialHistoryData={historyData}
              initialAddresses={initialAddresses}
            />
          </div>
        ))
      ) : (
        <Card className="p-8 text-center text-muted-foreground shadow-sm">
          <CardContent className="pt-6">
            <Home className="mx-auto mb-2 h-10 w-10 opacity-20" />
            <p className="text-sm">No active financial rollup clients in this household.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
