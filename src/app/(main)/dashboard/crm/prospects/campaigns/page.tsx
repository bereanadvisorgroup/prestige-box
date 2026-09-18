import { AlertCircle } from "lucide-react";

import { getCampaigns } from "@/actions/campaigns";
import { getProspectCustomFields } from "@/actions/prospect-custom-fields";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { CampaignsSection } from "../_components/campaigns-section";

export default async function ProspectsCampaignsPage() {
  const [campaignsRes, customFieldsRes] = await Promise.all([getCampaigns(), getProspectCustomFields()]);

  if (!campaignsRes.success) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Campaigns & Attribution</h1>
          <p className="mt-2 text-muted-foreground">Manage marketing campaigns and attribution touches.</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{campaignsRes.error || "Failed to fetch campaigns from the database."}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const campaigns = campaignsRes.campaigns || [];
  const customFields = customFieldsRes.success && customFieldsRes.fields ? customFieldsRes.fields : [];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
      <CampaignsSection campaigns={campaigns} customFields={customFields} />
    </div>
  );
}
