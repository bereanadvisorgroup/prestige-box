import { getWorkflowTemplates } from "@/actions/workflow-templates";

import { WorkflowTemplatesTable } from "./_components/workflow-templates-table";

export default async function WorkflowsPage() {
  const result = await getWorkflowTemplates();
  const templates = result.success && result.templates ? result.templates : [];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <WorkflowTemplatesTable data={templates} />
    </div>
  );
}
