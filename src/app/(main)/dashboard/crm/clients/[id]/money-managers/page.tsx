import { notFound } from "next/navigation";

import { Building2, TrendingUp } from "lucide-react";

import { getClient } from "@/actions/clients";
import { getMoneyManagers } from "@/actions/money-managers";
import { AssociationCardList } from "@/components/crm/association-card-list";
import { Card } from "@/components/ui/card";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MoneyManagersPage({ params }: Props) {
  const { id } = await params;
  const clientResult = await getClient(id);

  if (!clientResult.success || !clientResult.client) {
    notFound();
  }

  const client = clientResult.client;
  const moneyRes = await getMoneyManagers();
  const associatedMoneyManagers = ((moneyRes.success && moneyRes.moneyManagers) || []).filter((mm) =>
    mm.clientIds?.includes(client.id || ""),
  );

  return (
    <div className="bg-muted/5 p-4 md:p-6 lg:p-8">
      {associatedMoneyManagers.length > 0 ? (
        <AssociationCardList
          title="Associated Money Managers"
          description="Money managers this client is associated with"
          items={associatedMoneyManagers.map((c) => ({
            id: c.id || "",
            name: c.firmName,
            website: c.website,
            phone: c.phone,
          }))}
          linkPrefix="/dashboard/admin/money-managers"
          icon={TrendingUp}
        />
      ) : (
        <Card className="border-none bg-muted/10 p-8 text-center text-muted-foreground shadow-sm">
          <Building2 className="mx-auto mb-3 h-10 w-10 opacity-20" />
          <p className="text-sm italic">No associated money managers found.</p>
        </Card>
      )}
    </div>
  );
}
