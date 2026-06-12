import { notFound } from "next/navigation";

import { Building2, ReceiptText } from "lucide-react";

import { getAccountingFirms } from "@/actions/accounting-firms";
import { getClient } from "@/actions/clients";
import { AssociationCardList } from "@/components/crm/association-card-list";
import { Card } from "@/components/ui/card";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AccountingFirmsPage({ params }: Props) {
  const { id } = await params;
  const clientResult = await getClient(id);

  if (!clientResult.success || !clientResult.client) {
    notFound();
  }

  const client = clientResult.client;
  const accountingFirmsRes = await getAccountingFirms();
  const associatedAccountingFirms = ((accountingFirmsRes.success && accountingFirmsRes.accountingFirms) || []).filter(
    (a) => a.clientIds?.includes(client.id || ""),
  );

  return (
    <div className="bg-muted/5 p-4 md:p-6 lg:p-8">
      {associatedAccountingFirms.length > 0 ? (
        <AssociationCardList
          title="Associated Accounting Firms"
          description="Accounting firms this client is associated with"
          items={associatedAccountingFirms.map((f) => ({
            id: f.id || "",
            name: f.firmName,
            website: f.website,
            phone: f.phone,
          }))}
          linkPrefix="/dashboard/crm/accounting-firms"
          icon={ReceiptText}
        />
      ) : (
        <Card className="border-none bg-muted/10 p-8 text-center text-muted-foreground shadow-sm">
          <Building2 className="mx-auto mb-3 h-10 w-10 opacity-20" />
          <p className="text-sm italic">No associated accounting firms found.</p>
        </Card>
      )}
    </div>
  );
}
