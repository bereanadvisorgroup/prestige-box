import { notFound } from "next/navigation";

import { Building2, Landmark } from "lucide-react";

import { getBanks } from "@/actions/banks";
import { getClient } from "@/actions/clients";
import { AssociationCardList } from "@/components/crm/association-card-list";
import { Card } from "@/components/ui/card";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BanksPage({ params }: Props) {
  const { id } = await params;
  const clientResult = await getClient(id);

  if (!clientResult.success || !clientResult.client) {
    notFound();
  }

  const client = clientResult.client;
  const banksRes = await getBanks();
  const associatedBanks = ((banksRes.success && banksRes.banks) || []).filter((b) =>
    b.clientIds?.includes(client.id || ""),
  );

  return (
    <div className="bg-muted/5 p-4 md:p-6 lg:p-8">
      {associatedBanks.length > 0 ? (
        <AssociationCardList
          title="Associated Banks"
          description="Banks this client is associated with"
          items={associatedBanks.map((f) => ({
            id: f.id || "",
            name: f.firmName,
            website: f.website,
            phone: f.phone,
          }))}
          linkPrefix="/dashboard/crm/banks"
          icon={Landmark}
        />
      ) : (
        <Card className="border-none bg-muted/10 p-8 text-center text-muted-foreground shadow-sm">
          <Building2 className="mx-auto mb-3 h-10 w-10 opacity-20" />
          <p className="text-sm italic">No associated banks found.</p>
        </Card>
      )}
    </div>
  );
}
