import { notFound } from "next/navigation";

import { getCompany } from "@/actions/companies";
import { CompanyForm } from "@/app/(main)/dashboard/crm/companies/_components/company-form";

interface EditCompanyPageProps {
  params: {
    id: string;
  };
}

export default async function EditCompanyPage({ params }: EditCompanyPageProps) {
  const { id } = await params;
  const result = await getCompany(id);

  if (!result.success || !result.company) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <CompanyForm company={result.company} />
    </div>
  );
}
