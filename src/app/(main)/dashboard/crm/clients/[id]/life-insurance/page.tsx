import { notFound } from "next/navigation";

import { Building2, HeartHandshake } from "lucide-react";

import { getClient } from "@/actions/clients";
import { getLifeInsuranceCompanies } from "@/actions/life-insurance-companies";
import { getClientPoliciesByClient } from "@/actions/policies";
import { Card } from "@/components/ui/card";
import type { ClientPolicy } from "@/types/crm";

import { AssociationCardList } from "../_components/association-card-list";
import { DocumentsTab } from "../_components/tabs/documents-tab";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LifeInsurancePage({ params }: Props) {
  const { id } = await params;
  const clientResult = await getClient(id);

  if (!clientResult.success || !clientResult.client) {
    notFound();
  }

  const client = clientResult.client;

  const [policiesResult, lifeRes] = await Promise.all([getClientPoliciesByClient(id), getLifeInsuranceCompanies()]);

  const policies = (policiesResult.success ? policiesResult.policies : []) as (ClientPolicy & { id: string })[];
  const policyLifeIds = new Set(policies.map((p) => p.lifeInsuranceCompanyId).filter(Boolean));
  const associatedLife = ((lifeRes.success && lifeRes.companies) || []).filter((c) => policyLifeIds.has(c.id || ""));

  return (
    <div className="bg-muted/5 p-4 md:p-6 lg:p-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {associatedLife.length > 0 ? (
            <AssociationCardList
              title="Associated Life Insurance Companies"
              description="Life insurance companies this client is associated with via policies"
              items={associatedLife.map((c) => ({
                id: c.id || "",
                name: c.name,
                website: c.websiteUrl,
                phone: c.phone,
              }))}
              linkPrefix="/dashboard/admin/life-insurance-companies"
              icon={HeartHandshake}
            />
          ) : (
            <Card className="border-none bg-muted/10 p-8 text-center text-muted-foreground shadow-sm">
              <Building2 className="mx-auto mb-3 h-10 w-10 opacity-20" />
              <p className="text-sm italic">No associated life insurance companies found.</p>
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
