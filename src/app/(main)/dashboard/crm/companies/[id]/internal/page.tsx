import { notFound } from "next/navigation";

import { getCompany } from "@/actions/companies";
import { getNotes } from "@/actions/notes";
import { getTasks } from "@/actions/tasks";
import { getAdvisors } from "@/actions/users";
import { getWorkflows } from "@/actions/workflows";

import { CompanyAdvisorDropdown } from "../_components/company-advisor-dropdown";
import { CompanyDocumentsButton } from "../_components/company-documents-button";
import { CompanyHeaderPortal } from "../_components/company-header-portal";
import { CompanyNotesCard } from "../_components/company-notes-card";
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
  const [tasksResult, notesResult, advisorsResult, workflowsResult] = await Promise.all([
    getTasks({ companyId: id }),
    getNotes({ companyId: id }),
    getAdvisors(),
    getWorkflows("company", id),
  ]);

  const tasks = tasksResult.success && tasksResult.tasks ? tasksResult.tasks : [];
  const notes = notesResult.success && notesResult.notes ? notesResult.notes : [];
  const allAdvisors = advisorsResult.success ? advisorsResult.advisors || [] : [];
  const workflows = workflowsResult.success && workflowsResult.workflows ? workflowsResult.workflows : [];

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
      </CompanyHeaderPortal>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <CompanyTasksCard companyId={id} initialTasks={tasks} />
        <CompanyNotesCard companyId={id} initialNotes={notes} />
        <div className="md:col-span-2">
          <CompanyWorkflowStepsCard companyId={id} steps={outstandingSteps} />
        </div>
      </div>
    </div>
  );
}
