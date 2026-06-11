import { notFound } from "next/navigation";

import { getPropertyAndCasualtyFirm } from "@/actions/property-and-casualty";

import { PropertyAndCasualtyForm } from "../../_components/property-and-casualty-form";

interface EditPropertyAndCasualtyPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPropertyAndCasualtyPage({ params }: EditPropertyAndCasualtyPageProps) {
  const { id } = await params;
  const result = await getPropertyAndCasualtyFirm(id);

  if (!result.success || !result.propertyAndCasualtyFirm) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Edit Property And Casualty Firm</h1>
        <p className="mt-2 text-muted-foreground">Update firm information and associations.</p>
      </div>

      <PropertyAndCasualtyForm propertyAndCasualtyFirm={result.propertyAndCasualtyFirm} />
    </div>
  );
}
