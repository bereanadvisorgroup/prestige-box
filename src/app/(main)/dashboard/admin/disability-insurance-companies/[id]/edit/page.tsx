import { notFound } from "next/navigation";

import { getDisabilityInsuranceCompany } from "@/actions/disability-insurance-companies";

import { CompanyForm } from "../../_components/company-form";

interface EditDisabilityInsuranceCompanyPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditDisabilityInsuranceCompanyPage({ params }: EditDisabilityInsuranceCompanyPageProps) {
  const { id } = await params;
  const result = await getDisabilityInsuranceCompany(id);

  if (!result.success || !result.company) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <CompanyForm company={result.company} />
    </div>
  );
}
