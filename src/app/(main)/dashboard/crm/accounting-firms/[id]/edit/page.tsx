import { notFound } from "next/navigation";

import { getAccountingFirm } from "@/actions/accounting-firms";

import { AccountingFirmForm } from "../../_components/accounting-firm-form";

interface EditAccountingFirmPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditAccountingFirmPage({ params }: EditAccountingFirmPageProps) {
  const { id } = await params;
  const result = await getAccountingFirm(id);

  if (!result.success || !result.accountingFirm) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Edit Accounting Firm</h1>
        <p className="mt-2 text-muted-foreground">Update accounting firm information and associations.</p>
      </div>

      <AccountingFirmForm accountingFirm={result.accountingFirm} />
    </div>
  );
}
