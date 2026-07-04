import { redirect } from "next/navigation";

interface ClientPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ClientPage({ params }: ClientPageProps) {
  const { id } = await params;
  redirect(`/dashboard/crm/clients/${id}/internal`);
}
