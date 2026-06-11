import { notFound } from "next/navigation";

import { getRecordKeeper } from "@/actions/record-keepers";

import { RecordKeeperForm } from "../../_components/record-keeper-form";

interface EditRecordKeeperPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditRecordKeeperPage({ params }: EditRecordKeeperPageProps) {
  const { id } = await params;
  const result = await getRecordKeeper(id);

  if (!result.success || !result.recordKeeper) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Edit Record Keeper</h1>
        <p className="mt-2 text-muted-foreground">Update record keeper information and associations.</p>
      </div>

      <RecordKeeperForm recordKeeper={result.recordKeeper} />
    </div>
  );
}
