import { notFound } from "next/navigation";

import { getActuarialFirm } from "@/actions/actuarial-firms";

import { ActuarialFirmForm } from "../../_components/actuarial-firm-form";

interface EditActuarialFirmPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditActuarialFirmPage({ params }: EditActuarialFirmPageProps) {
  const { id } = await params;
  const result = await getActuarialFirm(id);

  if (!result.success || !result.actuarialFirm) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Edit Actuarial Firm</h1>
        <p className="mt-2 text-muted-foreground">Update actuarial firm information and associations.</p>
      </div>

      <ActuarialFirmForm actuarialFirm={result.actuarialFirm} />
    </div>
  );
}
