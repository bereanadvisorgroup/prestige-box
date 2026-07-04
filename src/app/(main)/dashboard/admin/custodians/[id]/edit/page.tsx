import { notFound } from "next/navigation";

import { getCustodian } from "@/actions/custodians";

import { CustodianForm } from "../../_components/custodian-form";

interface EditCustodianPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditCustodianPage({ params }: EditCustodianPageProps) {
  const { id } = await params;
  const result = await getCustodian(id);

  if (!result.success || !result.custodian) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Edit Custodian</h1>
        <p className="mt-2 text-muted-foreground">Update the name of the custodian.</p>
      </div>

      <CustodianForm custodian={result.custodian} />
    </div>
  );
}
