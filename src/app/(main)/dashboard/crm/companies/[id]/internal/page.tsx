import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

// The "internal" section currently surfaces change history.
export default async function CompanyInternalPage({ params }: PageProps) {
  const { id } = await params;
  redirect(`/dashboard/crm/companies/${id}/internal/history`);
}
