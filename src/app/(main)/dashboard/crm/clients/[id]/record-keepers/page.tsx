import { notFound } from "next/navigation";

import { Building2, Database } from "lucide-react";

import { getClient } from "@/actions/clients";
import { getRecordKeepers } from "@/actions/record-keepers";
import { Card } from "@/components/ui/card";

import { AssociationCardList } from "../_components/association-card-list";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RecordKeepersPage({ params }: Props) {
  const { id } = await params;
  const clientResult = await getClient(id);

  if (!clientResult.success || !clientResult.client) {
    notFound();
  }

  const client = clientResult.client;
  const recordRes = await getRecordKeepers();
  const associatedRecordKeepers = ((recordRes.success && recordRes.recordKeepers) || []).filter((rk) =>
    rk.clientIds?.includes(client.id || ""),
  );

  return (
    <div className="bg-muted/5 p-4 md:p-6 lg:p-8">
      {associatedRecordKeepers.length > 0 ? (
        <AssociationCardList
          title="Associated Record Keepers"
          description="Record keepers this client is associated with"
          items={associatedRecordKeepers.map((c) => ({
            id: c.id || "",
            name: c.firmName,
            website: c.website,
            phone: c.phone,
          }))}
          linkPrefix="/dashboard/admin/record-keepers"
          icon={Database}
        />
      ) : (
        <Card className="border-none bg-muted/10 p-8 text-center text-muted-foreground shadow-sm">
          <Building2 className="mx-auto mb-3 h-10 w-10 opacity-20" />
          <p className="text-sm italic">No associated record keepers found.</p>
        </Card>
      )}
    </div>
  );
}
