import { notFound } from "next/navigation";

import { getClient } from "@/actions/clients";

import { DocumentsTab } from "../_components/tabs/documents-tab";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EstatePlanningPage({ params }: Props) {
  const { id } = await params;
  const clientResult = await getClient(id);

  if (!clientResult.success || !clientResult.client) {
    notFound();
  }

  const client = clientResult.client;

  return (
    <div className="py-4">
      <DocumentsTab
        client={client}
        category="estateDocuments"
        title="Estate Planning Documents"
        types={["Will", "Revocable Trust", "Irrevocable Trust", "Other"]}
        uploadViaDialog={true}
        useHeaderPortal={true}
        noCard={true}
      />
    </div>
  );
}
