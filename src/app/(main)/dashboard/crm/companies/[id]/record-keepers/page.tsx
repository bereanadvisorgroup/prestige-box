import { notFound } from "next/navigation";

import { Building2, Database } from "lucide-react";

import { getCompany } from "@/actions/companies";
import { getRecordKeepers } from "@/actions/record-keepers";
import { AssociationCardList } from "@/components/crm/association-card-list";
import { Card } from "@/components/ui/card";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RecordKeepersPage({ params }: Props) {
  const { id } = await params;
  const companyResult = await getCompany(id);

  if (!companyResult.success || !companyResult.company) {
    notFound();
  }

  const company = companyResult.company;
  const rkRes = await getRecordKeepers();
  const associatedRK = ((rkRes.success && rkRes.recordKeepers) || []).filter((r) =>
    r.companyIds?.includes(company.id || ""),
  );

  return (
    <div className="bg-muted/5 p-4 md:p-6 lg:p-8">
      {associatedRK.length > 0 ? (
        <AssociationCardList
          title="Associated Record Keepers"
          description="Record keepers this company is associated with"
          items={associatedRK.map((r) => ({
            id: r.id || "",
            name: r.firmName,
            website: r.website,
            phone: r.phone,
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
