import { notFound } from "next/navigation";

import { getCompany } from "@/actions/companies";
import { getLongTermCareInsurances } from "@/actions/long-term-care-insurance";

import { CompanyLongTermCareManager } from "./_components/company-long-term-care-manager";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LongTermCareInsurancePage({ params }: Props) {
  const { id } = await params;
  const companyResult = await getCompany(id);

  if (!companyResult.success || !companyResult.company) {
    notFound();
  }

  const company = companyResult.company;
  const companiesRes = await getLongTermCareInsurances();
  const allCompanies = (companiesRes.success && companiesRes.companies) || [];

  return (
    <div className="bg-muted/5 p-4 md:p-6 lg:p-8">
      <CompanyLongTermCareManager company={company} allCompanies={allCompanies} />
    </div>
  );
}
