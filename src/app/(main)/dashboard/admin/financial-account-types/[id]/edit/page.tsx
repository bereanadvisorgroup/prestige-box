import { notFound } from "next/navigation";

import { getFinancialAccountType } from "@/actions/financial-account-types";

import { AccountTypeForm } from "../../_components/account-type-form";

interface EditFinancialAccountTypePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditFinancialAccountTypePage({ params }: EditFinancialAccountTypePageProps) {
  const { id } = await params;
  const result = await getFinancialAccountType(id);

  if (!result.success || !result.type) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Edit Financial Account Type</h1>
        <p className="mt-2 text-muted-foreground">Update the name of the financial account type.</p>
      </div>

      <AccountTypeForm accountType={result.type} />
    </div>
  );
}
