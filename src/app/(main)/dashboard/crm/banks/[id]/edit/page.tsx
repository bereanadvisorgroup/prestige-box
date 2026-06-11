import { notFound } from "next/navigation";

import { getBank } from "@/actions/banks";

import { BankForm } from "../../_components/bank-form";

interface EditBankPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditBankPage({ params }: EditBankPageProps) {
  const { id } = await params;
  const result = await getBank(id);

  if (!result.success || !result.bank) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Edit Bank</h1>
        <p className="mt-2 text-muted-foreground">Update bank information and associations.</p>
      </div>

      <BankForm bank={result.bank} />
    </div>
  );
}
