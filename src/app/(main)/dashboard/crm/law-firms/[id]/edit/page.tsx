import { notFound } from "next/navigation";

import { getLawFirm } from "@/actions/law-firms";

import { LawFirmForm } from "../../_components/law-firm-form";

interface EditLawFirmPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditLawFirmPage({ params }: EditLawFirmPageProps) {
  const { id } = await params;
  const result = await getLawFirm(id);

  if (!result.success || !result.lawFirm) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Edit Law Firm</h1>
        <p className="mt-2 text-muted-foreground">Update law firm information and associations.</p>
      </div>

      <LawFirmForm lawFirm={result.lawFirm} />
    </div>
  );
}
