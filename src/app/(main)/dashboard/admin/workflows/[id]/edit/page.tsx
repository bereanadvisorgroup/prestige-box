import { notFound } from "next/navigation";

import { getTeams } from "@/actions/teams";
import { getWorkflowTemplate } from "@/actions/workflow-templates";

import { TemplateBuilder } from "../../_components/template-builder";

interface EditWorkflowPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditWorkflowPage({ params }: EditWorkflowPageProps) {
  const { id } = await params;
  const [result, teamsRes] = await Promise.all([getWorkflowTemplate(id), getTeams()]);

  if (!result.success || !result.template) {
    notFound();
  }

  const teams = teamsRes.success ? teamsRes.teams || [] : [];

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 md:px-6">
      <TemplateBuilder template={result.template} teams={teams} />
    </div>
  );
}
