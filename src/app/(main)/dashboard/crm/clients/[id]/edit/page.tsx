import { redirect } from "next/navigation";

interface EditClientPageProps {
  params: {
    id: string;
  };
}

export default async function EditClientPage({ params }: EditClientPageProps) {
  const { id } = await params;
  redirect(`/dashboard/crm/clients/${id}`);
}
