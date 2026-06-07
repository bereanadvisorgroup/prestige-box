import { notFound } from "next/navigation";

import { getLawyer } from "@/actions/lawyers";

import { LawyerForm } from "../../_components/lawyer-form";

interface EditLawyerPageProps {
  params: {
    id: string;
  };
}

export default async function EditLawyerPage({ params }: EditLawyerPageProps) {
  const result = await getLawyer(params.id);

  if (!result.success || !result.lawyer) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Edit Lawyer</h1>
        <p className="mt-2 text-muted-foreground">Update lawyer information and associations.</p>
      </div>

      <LawyerForm lawyer={result.lawyer} />
    </div>
  );
}
