import { PipelineForm } from "../_components/pipeline-form";

export default function NewPipelinePage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Create Opportunity Pipeline</h1>
        <p className="mt-2 text-muted-foreground">Define a new pipeline and its sequential stages.</p>
      </div>

      <PipelineForm />
    </div>
  );
}
