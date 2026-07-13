import { getClients } from "@/actions/clients";
import { getCompanies } from "@/actions/companies";
import { getOpportunities } from "@/actions/opportunities";
import { getOpportunityPipelines } from "@/actions/opportunity-pipelines";
import { ClientHeaderPortal } from "@/app/(main)/dashboard/crm/clients/[id]/_components/client-header-portal";
import { OpportunitiesListView } from "@/app/(main)/dashboard/crm/opportunities/_components/opportunities-list-view";

interface ClientOpportunitiesPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ClientOpportunitiesPage({ params }: ClientOpportunitiesPageProps) {
  const { id } = await params;

  const [opportunitiesResult, pipelinesResult, clientsResult, companiesResult] = await Promise.all([
    getOpportunities({ clientId: id }),
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
      <ClientHeaderPortal sectionName="Opportunities" />
      <OpportunitiesListView
        opportunities={opportunities}
        pipelines={pipelines}
        clients={clients}
        companies={companies}
        clientId={id}
      />
    </div>
  );
}
