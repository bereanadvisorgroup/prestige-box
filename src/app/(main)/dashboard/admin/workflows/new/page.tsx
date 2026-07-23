import { getTeams } from "@/actions/teams";

import { TemplateBuilder } from "../_components/template-builder";

export default async function NewWorkflowPage() {
  const teamsRes = await getTeams();
  const teams = teamsRes.success ? teamsRes.teams || [] : [];

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 md:px-6">
      <TemplateBuilder teams={teams} />
    </div>
  );
}
