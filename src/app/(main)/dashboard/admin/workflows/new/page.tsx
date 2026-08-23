import { getTeams } from "@/actions/teams";
import { getWorkflowTemplates } from "@/actions/workflow-templates";

import { TemplateBuilder } from "../_components/template-builder";

export default async function NewWorkflowPage() {
  const [teamsRes, templatesRes] = await Promise.all([getTeams(), getWorkflowTemplates()]);
  const teams = teamsRes.success ? teamsRes.teams || [] : [];
  const availableTemplates = templatesRes.success
    ? (templatesRes.templates || []).map((t) => ({ id: t.id, name: t.name }))
    : [];

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 md:px-6">
      <TemplateBuilder teams={teams} availableTemplates={availableTemplates} />
    </div>
  );
}
