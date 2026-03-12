import { notFound } from "next/navigation";
import { getClient } from "@/actions/clients";
import { ClientForm } from "@/app/(main)/dashboard/crm/clients/_components/client-form";

interface EditClientPageProps {
  params: {
    id: string;
  };
}

export default async function EditClientPage({ params }: EditClientPageProps) {
  const { id } = await params;
  const result = await getClient(id);

  if (!result.success || !result.client) {
    notFound();
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 md:px-6">
      <ClientForm client={result.client} />
    </div>
  );
}
