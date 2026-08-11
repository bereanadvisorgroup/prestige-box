import { notFound } from "next/navigation";

import { getOpportunityPipeline } from "@/actions/opportunity-pipelines";

import { PipelineForm } from "../../_components/pipeline-form";

interface EditPipelinePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPipelinePage({ params }: EditPipelinePageProps) {
  const { id } = await params;
  const result = await getOpportunityPipeline(id);

  if (!result.success || !result.pipeline) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Edit Opportunity Pipeline</h1>
        <p className="mt-2 text-muted-foreground">Modify the pipeline name, active status, or reorder/add stages.</p>
      </div>

      <PipelineForm pipeline={result.pipeline} />
    </div>
  );
}
