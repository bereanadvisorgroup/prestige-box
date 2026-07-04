import { notFound } from "next/navigation";

import { getClient } from "@/actions/clients";

import { EmploymentTab } from "../_components/tabs/employment-tab";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EmploymentPage({ params }: Props) {
  const { id } = await params;
  const clientResult = await getClient(id);

  if (!clientResult.success || !clientResult.client) {
    notFound();
  }

  const client = clientResult.client;

  return (
    <div className="py-4">
      <EmploymentTab client={client} />
    </div>
  );
}
