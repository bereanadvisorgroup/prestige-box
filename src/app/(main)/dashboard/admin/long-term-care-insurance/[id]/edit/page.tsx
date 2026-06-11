import { notFound } from "next/navigation";

import { getLongTermCareInsurance } from "@/actions/long-term-care-insurance";

import { InsuranceForm } from "../../_components/insurance-form";

interface EditLongTermCareInsurancePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditLongTermCareInsurancePage({ params }: EditLongTermCareInsurancePageProps) {
  const { id } = await params;
  const result = await getLongTermCareInsurance(id);

  if (!result.success || !result.company) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <InsuranceForm company={result.company} />
    </div>
  );
}
