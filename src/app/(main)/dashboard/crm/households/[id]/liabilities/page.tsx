import { notFound } from "next/navigation";

import { DollarSign } from "lucide-react";

import { getAssets } from "@/actions/assets";
import { getBanks } from "@/actions/banks";
import { getClients } from "@/actions/clients";
import { getHouseholdActiveRollupClients } from "@/actions/households";
import { LiabilitiesTab } from "@/app/(main)/dashboard/crm/clients/[id]/_components/tabs/liabilities-tab";
import { Card, CardContent } from "@/components/ui/card";

import { HouseholdHeaderPortal } from "../_components/household-header-portal";

interface HouseholdLiabilitiesPageProps {
  params: Promise<{ id: string }>;
}

export default async function HouseholdLiabilitiesPage({ params }: HouseholdLiabilitiesPageProps) {
  const { id } = await params;
  const activeRes = await getHouseholdActiveRollupClients(id);

  if (!activeRes.success || !activeRes.household) {
    notFound();
  }

  const { clientIds } = activeRes;

  const [allClientsRes, banksRes] = await Promise.all([getClients(), getBanks()]);

  const allClients = allClientsRes.success ? allClientsRes.clients || [] : [];
  const activeClients = allClients.filter((c) => clientIds.includes(c.id || ""));
  const allBanks = (banksRes.success && banksRes.banks) || [];

  const clientLiabilityData = await Promise.all(
    activeClients.map(async (client) => {
      const assetsRes = await getAssets(client.id || "");
      const associatedBanks = allBanks.filter((b) => b.clientIds?.includes(client.id || ""));
      const clientAssets = (assetsRes.success && assetsRes.assets) || [];

      return {
        client,
        associatedBanks,
        clientAssets,
      };
    }),
  );

  return (
    <div className="space-y-6 py-4">
      <HouseholdHeaderPortal sectionName="Liabilities" />
      {clientLiabilityData.length > 0 ? (
        clientLiabilityData.map(({ client, associatedBanks, clientAssets }) => (
          <div key={client.id} className="space-y-2">
            <h3 className="font-semibold text-muted-foreground text-sm uppercase tracking-wider">
              Client: {client.person ? `${client.person.firstName} ${client.person.lastName}` : client.id}
            </h3>
            <LiabilitiesTab client={client} associatedBanks={associatedBanks} clientAssets={clientAssets} />
          </div>
        ))
      ) : (
        <Card className="p-8 text-center text-muted-foreground shadow-sm">
          <CardContent className="pt-6">
            <DollarSign className="mx-auto mb-2 h-10 w-10 opacity-20" />
            <p className="text-sm">No active financial rollup clients in this household.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
