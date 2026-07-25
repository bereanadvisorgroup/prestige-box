import { getClients } from "@/actions/clients";
import { getCompanies } from "@/actions/companies";
import { getOpportunities, getOpportunityTargetDateHistory } from "@/actions/opportunities";
import { getOpportunityPipelines } from "@/actions/opportunity-pipelines";

import { KanbanBoard } from "./_components/kanban-board";

export default async function OpportunitiesPage() {
  const [pipelinesResult, opportunitiesResult, clientsResult, companiesResult, historyResult] = await Promise.all([
    getOpportunityPipelines(),
    getOpportunities(),
    getClients(),
    getCompanies(),
    getOpportunityTargetDateHistory(),
  ]);

  const pipelines = pipelinesResult.success ? pipelinesResult.pipelines || [] : [];
  const opportunities = opportunitiesResult.success ? opportunitiesResult.opportunities || [] : [];
  const clients = clientsResult.success ? clientsResult.clients || [] : [];
  const companies = companiesResult.success ? companiesResult.companies || [] : [];
  const targetDateHistory = historyResult.success ? historyResult.history || [] : [];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
      <KanbanBoard
        initialOpportunities={opportunities}
        pipelines={pipelines}
        clients={clients}
        companies={companies}
        targetDateHistory={targetDateHistory}
      />
    </div>
  );
}

