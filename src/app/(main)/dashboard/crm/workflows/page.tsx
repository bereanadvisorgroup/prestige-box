import { getAllWorkflows } from "@/actions/workflows";
import { AllWorkflowsList } from "@/components/workflows/all-workflows-list";

export default async function WorkflowPage() {
  const result = await getAllWorkflows();
  const workflows = result.success && result.workflows ? result.workflows : [];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <AllWorkflowsList workflows={workflows} />
    </div>
  );
}
