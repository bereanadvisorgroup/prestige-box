import { notFound } from "next/navigation";

import { Building2, Calculator } from "lucide-react";

import { getActuarialFirms } from "@/actions/actuarial-firms";
import { getClient } from "@/actions/clients";
import { AssociationCardList } from "@/components/crm/association-card-list";
import { Card } from "@/components/ui/card";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ActuarialFirmsPage({ params }: Props) {
  const { id } = await params;
  const clientResult = await getClient(id);

  if (!clientResult.success || !clientResult.client) {
    notFound();
  }

  const client = clientResult.client;
  const actuarialFirmsRes = await getActuarialFirms();
  const associatedActuarialFirms = ((actuarialFirmsRes.success && actuarialFirmsRes.actuarialFirms) || []).filter(
    (act) => act.clientIds?.includes(client.id || ""),
  );

  return (
    <div className="bg-muted/5 p-4 md:p-6 lg:p-8">
      {associatedActuarialFirms.length > 0 ? (
        <AssociationCardList
          title="Associated Actuarial Firms"
          description="Actuarial firms this client is associated with"
          items={associatedActuarialFirms.map((f) => ({
            id: f.id || "",
            name: f.firmName,
            website: f.website,
            phone: f.phone,
          }))}
          linkPrefix="/dashboard/crm/actuarial-firms"
          icon={Calculator}
        />
      ) : (
        <Card className="border-none bg-muted/10 p-8 text-center text-muted-foreground shadow-sm">
          <Building2 className="mx-auto mb-3 h-10 w-10 opacity-20" />
          <p className="text-sm italic">No associated actuarial firms found.</p>
        </Card>
      )}
    </div>
  );
}
