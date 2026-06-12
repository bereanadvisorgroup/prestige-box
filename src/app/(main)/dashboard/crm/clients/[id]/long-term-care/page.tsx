import { notFound } from "next/navigation";

import { Building2, HeartPulse } from "lucide-react";

import { getClient } from "@/actions/clients";
import { getLongTermCareInsurances } from "@/actions/long-term-care-insurance";
import { getClientPoliciesByClient } from "@/actions/policies";
import { AssociationCardList } from "@/components/crm/association-card-list";
import { Card } from "@/components/ui/card";
import type { ClientPolicy } from "@/types/crm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LongTermCarePage({ params }: Props) {
  const { id } = await params;
  const clientResult = await getClient(id);

  if (!clientResult.success || !clientResult.client) {
    notFound();
  }

  const _client = clientResult.client;

  const [policiesResult, ltcRes] = await Promise.all([getClientPoliciesByClient(id), getLongTermCareInsurances()]);

  const policies = (policiesResult.success ? policiesResult.policies : []) as (ClientPolicy & { id: string })[];
  const policyLtcIds = new Set(policies.map((p) => p.longTermCareInsuranceId).filter(Boolean));
  const associatedLtc = ((ltcRes.success && ltcRes.companies) || []).filter((c) => policyLtcIds.has(c.id || ""));

  return (
    <div className="bg-muted/5 p-4 md:p-6 lg:p-8">
      {associatedLtc.length > 0 ? (
        <AssociationCardList
          title="Associated Long Term Care Insurance"
          description="Long term care insurance companies this client is associated with via policies"
          items={associatedLtc.map((c) => ({
            id: c.id || "",
            name: c.name,
            website: c.websiteUrl,
            phone: c.phone,
          }))}
          linkPrefix="/dashboard/admin/long-term-care-insurance"
          icon={HeartPulse}
        />
      ) : (
        <Card className="border-none bg-muted/10 p-8 text-center text-muted-foreground shadow-sm">
          <Building2 className="mx-auto mb-3 h-10 w-10 opacity-20" />
          <p className="text-sm italic">No associated long term care insurance companies found.</p>
        </Card>
      )}
    </div>
  );
}
