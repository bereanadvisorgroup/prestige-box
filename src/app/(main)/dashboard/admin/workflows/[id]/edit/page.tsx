import { notFound } from "next/navigation";

import { getWorkflowTemplate } from "@/actions/workflow-templates";

import { TemplateBuilder } from "../../_components/template-builder";

interface EditWorkflowPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditWorkflowPage({ params }: EditWorkflowPageProps) {
  const { id } = await params;
  const result = await getWorkflowTemplate(id);

  if (!result.success || !result.template) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 md:px-6">
      <TemplateBuilder template={result.template} />
    </div>
  );
}
