import { redirect } from "next/navigation";

interface HouseholdPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function HouseholdPage({ params }: HouseholdPageProps) {
  const { id } = await params;
  redirect(`/dashboard/crm/households/${id}/internal`);
}
