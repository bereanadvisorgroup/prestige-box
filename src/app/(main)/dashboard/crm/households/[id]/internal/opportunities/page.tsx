import { notFound } from "next/navigation";

import { getClients } from "@/actions/clients";
import { getCompanies } from "@/actions/companies";
import { getHouseholdActiveRollupClients } from "@/actions/households";
import { getOpportunities } from "@/actions/opportunities";
import { getOpportunityPipelines } from "@/actions/opportunity-pipelines";
import { OpportunitiesListView } from "@/app/(main)/dashboard/crm/opportunities/_components/opportunities-list-view";

import { HouseholdHeaderPortal } from "../../_components/household-header-portal";

interface HouseholdOpportunitiesPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function HouseholdOpportunitiesPage({ params }: HouseholdOpportunitiesPageProps) {
  const { id } = await params;
  const activeRes = await getHouseholdActiveRollupClients(id);

  if (!activeRes.success || !activeRes.household) {
    notFound();
  }

  const { clientIds } = activeRes;

  const [opportunitiesResult, pipelinesResult, clientsResult, companiesResult] = await Promise.all([
    getOpportunities({ clientIds }),
    getOpportunityPipelines(),
    getClients(),
    getCompanies(),
  ]);

  const opportunities = opportunitiesResult.success ? opportunitiesResult.opportunities || [] : [];
  const pipelines = pipelinesResult.success ? pipelinesResult.pipelines || [] : [];
  const clients = clientsResult.success ? clientsResult.clients || [] : [];
  const companies = companiesResult.success ? companiesResult.companies || [] : [];

  return (
    <div className="space-y-6 py-4">
      <HouseholdHeaderPortal sectionName="Opportunities" />
      <OpportunitiesListView
        opportunities={opportunities}
        pipelines={pipelines}
        clients={clients}
        companies={companies}
        clientId={clientIds[0] || id}
      />
    </div>
  );
}
