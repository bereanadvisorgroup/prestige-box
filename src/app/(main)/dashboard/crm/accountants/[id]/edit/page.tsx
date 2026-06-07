import { notFound } from "next/navigation";

import { getAccountant } from "@/actions/accountants";

import { AccountantForm } from "../../_components/accountant-form";

interface EditAccountantPageProps {
  params: {
    id: string;
  };
}

export default async function EditAccountantPage({ params }: EditAccountantPageProps) {
  const result = await getAccountant(params.id);

  if (!result.success || !result.accountant) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Edit Accountant</h1>
        <p className="mt-2 text-muted-foreground">Update accountant information and associations.</p>
      </div>

      <AccountantForm accountant={result.accountant} />
    </div>
  );
}
