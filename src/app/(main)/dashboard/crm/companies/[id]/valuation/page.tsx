import { notFound } from "next/navigation";

import { getCompany, getCompanyValuationHistory } from "@/actions/companies";

import { ValuationHistory } from "../_components/valuation-history";

interface ValuationPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CompanyValuationPage({ params }: ValuationPageProps) {
  const { id } = await params;
  const result = await getCompany(id);

  if (!result.success || !result.company) {
    notFound();
  }

  const company = result.company;
  const valuationHistoryResult = await getCompanyValuationHistory(id);
  const valuationHistory = valuationHistoryResult.success ? valuationHistoryResult.history || [] : [];

  return (
    <div className="bg-muted/5 p-4 md:p-6 lg:p-8">
      <ValuationHistory companyId={company.id!} initialHistory={valuationHistory} />
    </div>
  );
}
