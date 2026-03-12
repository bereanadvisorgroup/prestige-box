import { notFound } from "next/navigation";
import { getInsuranceCompany } from "@/actions/insurance-companies";
import { CompanyForm } from "@/app/(main)/dashboard/admin/insurance-companies/_components/company-form";

interface EditInsuranceCompanyPageProps {
  params: {
    id: string;
  };
}

export default async function EditInsuranceCompanyPage({ params }: EditInsuranceCompanyPageProps) {
  const { id } = await params;
  const result = await getInsuranceCompany(id);

  if (!result.success || !result.company) {
    notFound();
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 md:px-6">
      <CompanyForm company={result.company} />
    </div>
  );
}
