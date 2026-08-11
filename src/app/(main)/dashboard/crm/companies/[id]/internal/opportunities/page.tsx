import { getClients } from "@/actions/clients";
import { getCompanies } from "@/actions/companies";
import { getOpportunities } from "@/actions/opportunities";
import { getOpportunityPipelines } from "@/actions/opportunity-pipelines";
import { CompanyHeaderPortal } from "@/app/(main)/dashboard/crm/companies/[id]/_components/company-header-portal";
import { OpportunitiesListView } from "@/app/(main)/dashboard/crm/opportunities/_components/opportunities-list-view";

interface CompanyOpportunitiesPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CompanyOpportunitiesPage({ params }: CompanyOpportunitiesPageProps) {
  const { id } = await params;

  const [opportunitiesResult, pipelinesResult, clientsResult, companiesResult] = await Promise.all([
    getOpportunities({ companyId: id }),
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
      <CompanyHeaderPortal sectionName="Opportunities" />
      <OpportunitiesListView
        opportunities={opportunities}
        pipelines={pipelines}
        clients={clients}
        companies={companies}
        companyId={id}
      />
    </div>
  );
}
