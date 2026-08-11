import { notFound } from "next/navigation";

import { getInsuranceAgency } from "@/actions/insurance-agencies";

import { InsuranceAgencyForm } from "../../_components/insurance-agency-form";

export const dynamic = "force-dynamic";

interface EditInsuranceAgencyPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditInsuranceAgencyPage({ params }: EditInsuranceAgencyPageProps) {
  const { id } = await params;
  const result = await getInsuranceAgency(id);

  if (!result.success || !result.insuranceAgency) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 md:px-6">
      <InsuranceAgencyForm insuranceAgency={result.insuranceAgency} />
    </div>
  );
}
