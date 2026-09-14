import { AlertCircle } from "lucide-react";

import { getCampaigns } from "@/actions/campaigns";
import { getProspectCustomFields } from "@/actions/prospect-custom-fields";
import { getProspectScoringRules } from "@/actions/prospect-scoring-rules";
import { getProspects } from "@/actions/prospects";
import { getAdvisors } from "@/actions/users";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatFullName } from "@/lib/utils";

import { ProspectsClient } from "./_components/prospects-client";

export default async function ProspectsPage() {
  const [prospectsRes, campaignsRes, customFieldsRes, scoringRulesRes, advisorsRes] = await Promise.all([
    getProspects(),
    getCampaigns(),
    getProspectCustomFields(),
    getProspectScoringRules(),
    getAdvisors(),
  ]);

  if (!prospectsRes.success) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Prospects & Campaigns</h1>
          <p className="mt-2 text-muted-foreground">Manage prospective clients and campaign attribution.</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{prospectsRes.error || "Failed to fetch prospects from the database."}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const prospects = prospectsRes.prospects || [];
  const campaigns = campaignsRes.success && campaignsRes.campaigns ? campaignsRes.campaigns : [];
  const customFields = customFieldsRes.success && customFieldsRes.fields ? customFieldsRes.fields : [];
  const scoringRules = scoringRulesRes.success && scoringRulesRes.rules ? scoringRulesRes.rules : [];
  const rawAdvisors = advisorsRes.success && advisorsRes.advisors ? advisorsRes.advisors : [];

  const advisors = rawAdvisors.map((a) => ({
    uid: a.uid,
    name: formatFullName(a.firstName, a.lastName, "", "", "") || a.uid,
  }));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
      <ProspectsClient
        initialProspects={prospects}
        initialCampaigns={campaigns}
        customFields={customFields}
        scoringRules={scoringRules}
        advisors={advisors}
      />
    </div>
  );
}
