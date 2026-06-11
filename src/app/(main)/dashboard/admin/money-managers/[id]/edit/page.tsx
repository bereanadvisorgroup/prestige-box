import { notFound } from "next/navigation";

import { getMoneyManager } from "@/actions/money-managers";

import { MoneyManagerForm } from "../../_components/money-manager-form";

interface EditMoneyManagerPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditMoneyManagerPage({ params }: EditMoneyManagerPageProps) {
  const { id } = await params;
  const result = await getMoneyManager(id);

  if (!result.success || !result.moneyManager) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Edit Money Manager</h1>
        <p className="mt-2 text-muted-foreground">Update money manager information and associations.</p>
      </div>

      <MoneyManagerForm moneyManager={result.moneyManager} />
    </div>
  );
}
