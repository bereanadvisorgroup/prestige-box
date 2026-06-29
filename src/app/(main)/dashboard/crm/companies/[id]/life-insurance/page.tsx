import { notFound } from "next/navigation";

import { getCompany } from "@/actions/companies";
import { getLifeInsuranceCompanies } from "@/actions/life-insurance-companies";

import { CompanyLifeInsuranceManager } from "./_components/company-life-insurance-manager";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LifeInsuranceCompanyPage({ params }: Props) {
  const { id } = await params;
  const companyResult = await getCompany(id);

  if (!companyResult.success || !companyResult.company) {
    notFound();
  }

  const company = companyResult.company;
  const companiesRes = await getLifeInsuranceCompanies();
  const allCompanies = (companiesRes.success && companiesRes.companies) || [];

  return (
    <div className="bg-muted/5 p-4 md:p-6 lg:p-8">
      <CompanyLifeInsuranceManager company={company} allCompanies={allCompanies} />
    </div>
  );
}
