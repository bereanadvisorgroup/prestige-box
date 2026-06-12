import { notFound } from "next/navigation";

import { Building2, Scale } from "lucide-react";

import { getClient } from "@/actions/clients";
import { getLawFirms } from "@/actions/law-firms";
import { AssociationCardList } from "@/components/crm/association-card-list";
import { Card } from "@/components/ui/card";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LawFirmsPage({ params }: Props) {
  const { id } = await params;
  const clientResult = await getClient(id);

  if (!clientResult.success || !clientResult.client) {
    notFound();
  }

  const client = clientResult.client;
  const lawFirmsRes = await getLawFirms();
  const associatedLawFirms = ((lawFirmsRes.success && lawFirmsRes.lawFirms) || []).filter((l) =>
    l.clientIds?.includes(client.id || ""),
  );

  return (
    <div className="bg-muted/5 p-4 md:p-6 lg:p-8">
      {associatedLawFirms.length > 0 ? (
        <AssociationCardList
          title="Associated Law Firms"
          description="Law firms this client is associated with"
          items={associatedLawFirms.map((f) => ({
            id: f.id || "",
            name: f.firmName,
            website: f.website,
            phone: f.phone,
          }))}
          linkPrefix="/dashboard/crm/law-firms"
          icon={Scale}
        />
      ) : (
        <Card className="border-none bg-muted/10 p-8 text-center text-muted-foreground shadow-sm">
          <Building2 className="mx-auto mb-3 h-10 w-10 opacity-20" />
          <p className="text-sm italic">No associated law firms found.</p>
        </Card>
      )}
    </div>
  );
}
