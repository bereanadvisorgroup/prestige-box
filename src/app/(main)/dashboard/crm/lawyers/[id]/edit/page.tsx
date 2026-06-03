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
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto py-8 px-4 md:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Lawyer</h1>
        <p className="text-muted-foreground mt-2">Update lawyer information and associations.</p>
      </div>

      <LawyerForm lawyer={result.lawyer} />
    </div>
  );
}
