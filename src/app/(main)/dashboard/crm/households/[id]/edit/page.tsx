import { notFound } from "next/navigation";

import { getHousehold } from "@/actions/households";
import { HouseholdForm } from "@/app/(main)/dashboard/crm/households/_components/household-form";

interface EditHouseholdPageProps {
  params: {
    id: string;
  };
}

export default async function EditHouseholdPage({ params }: EditHouseholdPageProps) {
  const { id } = await params;
  const result = await getHousehold(id);

  if (!result.success || !result.household) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <HouseholdForm household={result.household} />
    </div>
  );
}
