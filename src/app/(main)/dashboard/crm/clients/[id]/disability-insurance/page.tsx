import { notFound } from "next/navigation";

import { Building2, ShieldAlert } from "lucide-react";

import { getClient } from "@/actions/clients";
import { getDisabilityInsuranceCompanies } from "@/actions/disability-insurance-companies";
import { getClientPoliciesByClient } from "@/actions/policies";
import { AssociationCardList } from "@/components/crm/association-card-list";
import { Card } from "@/components/ui/card";
import type { ClientPolicy } from "@/types/crm";

import { DocumentsTab } from "../_components/tabs/documents-tab";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DisabilityInsurancePage({ params }: Props) {
  const { id } = await params;
  const clientResult = await getClient(id);

  if (!clientResult.success || !clientResult.client) {
    notFound();
  }

  const client = clientResult.client;

  const [policiesResult, disabilityRes] = await Promise.all([
    getClientPoliciesByClient(id),
    getDisabilityInsuranceCompanies(),
  ]);

  const policies = (policiesResult.success ? policiesResult.policies : []) as (ClientPolicy & { id: string })[];
  const policyDisabilityIds = new Set(policies.map((p) => p.disabilityInsuranceCompanyId).filter(Boolean));
  const associatedDisability = ((disabilityRes.success && disabilityRes.companies) || []).filter((c) =>
    policyDisabilityIds.has(c.id || ""),
  );

  return (
    <div className="bg-muted/5 p-4 md:p-6 lg:p-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {associatedDisability.length > 0 ? (
            <AssociationCardList
              title="Associated Disability Insurance Companies"
              description="Disability insurance companies this client is associated with via policies"
              items={associatedDisability.map((c) => ({
                id: c.id || "",
                name: c.name,
                website: c.websiteUrl,
                phone: c.phone,
              }))}
              linkPrefix="/dashboard/admin/disability-insurance-companies"
              icon={ShieldAlert}
            />
          ) : (
            <Card className="border-none bg-muted/10 p-8 text-center text-muted-foreground shadow-sm">
              <Building2 className="mx-auto mb-3 h-10 w-10 opacity-20" />
              <p className="text-sm italic">No associated disability insurance companies found.</p>
            </Card>
          )}
        </div>

        <div className="lg:col-span-1">
          <DocumentsTab
            client={client}
            category="lifeDocuments"
            title="Life & Disability Documents"
            types={["Life", "STD/LTD", "Other"]}
          />
        </div>
      </div>
    </div>
  );
}
