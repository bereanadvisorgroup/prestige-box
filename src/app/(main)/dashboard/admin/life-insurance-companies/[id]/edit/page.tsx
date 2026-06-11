import { notFound } from "next/navigation";

import { getLifeInsuranceCompany } from "@/actions/life-insurance-companies";

import { CompanyForm } from "../../_components/company-form";

interface EditLifeInsuranceCompanyPageProps {
  params: {
    id: string;
  };
}

export default async function EditLifeInsuranceCompanyPage({ params }: EditLifeInsuranceCompanyPageProps) {
  const { id } = await params;
  const result = await getLifeInsuranceCompany(id);

  if (!result.success || !result.company) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <CompanyForm company={result.company} />
    </div>
  );
}
