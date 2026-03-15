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
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto py-8 px-4 md:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Accountant</h1>
        <p className="text-muted-foreground mt-2">Update accountant information and associations.</p>
      </div>

      <AccountantForm accountant={result.accountant} />
    </div>
  );
}
