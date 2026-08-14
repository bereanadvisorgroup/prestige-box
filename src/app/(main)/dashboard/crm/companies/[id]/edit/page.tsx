import { notFound } from "next/navigation";

import { getCompany, getCompanyEmployees, getCompanyOwners } from "@/actions/companies";
import { CompanyForm } from "@/app/(main)/dashboard/crm/companies/_components/company-form";

interface EditCompanyPageProps {
  params: {
    id: string;
  };
}

export default async function EditCompanyPage({ params }: EditCompanyPageProps) {
  const { id } = await params;
  const [companyRes, ownersRes, employeesRes] = await Promise.all([
    getCompany(id),
    getCompanyOwners(id),
    getCompanyEmployees(id),
  ]);

  if (!companyRes.success || !companyRes.company) {
    notFound();
  }

  const company = companyRes.company;
  const owners = ownersRes.success ? ownersRes.owners || [] : [];
  const employees = employeesRes.success ? employeesRes.employees || [] : [];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <CompanyForm company={company} initialOwners={owners} initialEmployees={employees} />
    </div>
  );
}
