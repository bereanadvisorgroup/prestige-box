import Link from "next/link";
import { notFound } from "next/navigation";

import { Pencil } from "lucide-react";

import { getCompany } from "@/actions/companies";
import { getNotes } from "@/actions/notes";
import { getTasks } from "@/actions/tasks";
import { getTeams } from "@/actions/teams";
import { getAdvisors } from "@/actions/users";
import { getWorkflows } from "@/actions/workflows";
import { Button } from "@/components/ui/button";

import { CompanyAdvisorDropdown } from "../_components/company-advisor-dropdown";
import { CompanyDocumentsButton } from "../_components/company-documents-button";
import { CompanyEmployeesCard } from "../_components/company-employees-card";
import { CompanyHeaderPortal } from "../_components/company-header-portal";
import { CompanyNotebookButton } from "../_components/company-notebook-button";
import { CompanyNotesCard } from "../_components/company-notes-card";
import { CompanyOwnersCard } from "../_components/company-owners-card";
import { CompanyTasksCard } from "../_components/company-tasks-card";
import { CompanyWorkflowStepsCard } from "../_components/company-workflow-steps-card";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CompanyInternalPage({ params }: PageProps) {
  const { id } = await params;
  const companyResult = await getCompany(id);

  if (!companyResult.success || !companyResult.company) {
    notFound();
  }

  const company = companyResult.company;

  // Fetch all required data for the Company Internal Overview dashboard
  const [tasksResult, notesResult, advisorsResult, workflowsResult, teamsResult] = await Promise.all([
    getTasks({ companyId: id }),
    getNotes({ companyId: id }),
    getAdvisors(),
    getWorkflows("company", id),
    getTeams(),
  ]);

  const tasks = tasksResult.success && tasksResult.tasks ? tasksResult.tasks : [];
  const notes = notesResult.success && notesResult.notes ? notesResult.notes : [];
  const allAdvisors = advisorsResult.success ? advisorsResult.advisors || [] : [];
  const workflows = workflowsResult.success && workflowsResult.workflows ? workflowsResult.workflows : [];
  const teams = teamsResult.success ? teamsResult.teams || [] : [];

  // Filter and sort outstanding steps
  const outstandingSteps = workflows.flatMap((w) =>
    (w.steps || [])
      .filter((s) => !s.completedAt)
      .map((s) => ({
        ...s,
        workflowName: w.name,
        workflowId: w.id,
      })),
  );

  outstandingSteps.sort((a, b) => {
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return (
    <div className="space-y-6 p-6">
      <CompanyHeaderPortal sectionName="Overview">
        <CompanyAdvisorDropdown company={company} advisors={allAdvisors} />
        <CompanyDocumentsButton company={company} />
        <CompanyNotebookButton company={company} />
        <Link href={`/dashboard/crm/companies/${id}/edit`}>
          <Button variant="outline" size="sm">
            <Pencil className="mr-2 h-4 w-4" />
            Edit Company
          </Button>
        </Link>
      </CompanyHeaderPortal>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <CompanyTasksCard companyId={id} initialTasks={tasks} />
        <CompanyNotesCard companyId={id} initialNotes={notes} />
        <div className="md:col-span-2">
          <CompanyWorkflowStepsCard companyId={id} steps={outstandingSteps} teams={teams} />
        </div>
        <div className="md:col-span-2">
          <CompanyOwnersCard owners={company.owners || []} estimatedValue={company.estimatedValue} />
        </div>
        <div className="md:col-span-2">
          <CompanyEmployeesCard employees={company.employees || []} />
        </div>
      </div>
    </div>
  );
}
