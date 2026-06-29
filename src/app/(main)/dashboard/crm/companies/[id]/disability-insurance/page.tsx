import { notFound } from "next/navigation";

import { getCompany } from "@/actions/companies";
import { getDisabilityInsuranceCompanies } from "@/actions/disability-insurance-companies";

import { CompanyDisabilityInsuranceManager } from "./_components/company-disability-insurance-manager";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DisabilityInsuranceCompanyPage({ params }: Props) {
  const { id } = await params;
  const companyResult = await getCompany(id);

  if (!companyResult.success || !companyResult.company) {
    notFound();
  }

  const company = companyResult.company;
  const companiesRes = await getDisabilityInsuranceCompanies();
  const allCompanies = (companiesRes.success && companiesRes.companies) || [];

  return (
    <div className="bg-muted/5 p-4 md:p-6 lg:p-8">
      <CompanyDisabilityInsuranceManager company={company} allCompanies={allCompanies} />
    </div>
  );
}
