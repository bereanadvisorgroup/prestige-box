import { AlertCircle } from "lucide-react";

import { getProspectCustomFields } from "@/actions/prospect-custom-fields";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { CustomFieldsSection } from "../_components/custom-fields-section";

export default async function ProspectsCustomFieldsPage() {
  const customFieldsRes = await getProspectCustomFields();

  if (!customFieldsRes.success) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Custom Fields</h1>
          <p className="mt-2 text-muted-foreground">Manage dynamic custom fields for prospects.</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {customFieldsRes.error || "Failed to fetch custom fields from the database."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const customFields = customFieldsRes.fields || [];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
      <CustomFieldsSection customFields={customFields} />
    </div>
  );
}
