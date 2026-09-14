import Link from "next/link";

import { AlertCircle, ArrowLeft } from "lucide-react";

import { getCampaigns } from "@/actions/campaigns";
import { getProspectCustomFields } from "@/actions/prospect-custom-fields";
import { getProspect } from "@/actions/prospects";
import { getAdvisors } from "@/actions/users";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { formatFullName } from "@/lib/utils";

import { ProspectDetailClient } from "./_components/prospect-detail-client";

interface ProspectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProspectDetailPage({ params }: ProspectDetailPageProps) {
  const { id } = await params;

  const [prospectRes, customFieldsRes, campaignsRes, advisorsRes] = await Promise.all([
    getProspect(id),
    getProspectCustomFields(),
    getCampaigns(),
    getAdvisors(),
  ]);

  if (!prospectRes.success || !prospectRes.prospect) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-6">
        <Button variant="ghost" size="sm" asChild className="w-fit gap-1 text-muted-foreground">
          <Link href="/dashboard/crm/prospects">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Prospects</span>
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Prospect Not Found</AlertTitle>
          <AlertDescription>
            {prospectRes.error || "The requested prospect record could not be found or has been deleted."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const prospect = prospectRes.prospect;
  const customFields = customFieldsRes.success && customFieldsRes.fields ? customFieldsRes.fields : [];
  const campaigns = campaignsRes.success && campaignsRes.campaigns ? campaignsRes.campaigns : [];
  const rawAdvisors = advisorsRes.success && advisorsRes.advisors ? advisorsRes.advisors : [];

  const advisors = rawAdvisors.map((a) => ({
    uid: a.uid,
    name: formatFullName(a.firstName, a.lastName, "", "", "") || a.uid,
  }));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
      <ProspectDetailClient
        prospect={prospect}
        primaryCampaign={prospectRes.primaryCampaign}
        assignedRep={prospectRes.assignedRep}
        convertedClient={prospectRes.convertedClient}
        attributions={prospectRes.attributions || []}
        notes={prospectRes.notes || []}
        tasks={prospectRes.tasks || []}
        history={prospectRes.history || []}
        customFields={customFields}
        campaigns={campaigns}
        advisors={advisors}
      />
    </div>
  );
}
