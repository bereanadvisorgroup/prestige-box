import { notFound } from "next/navigation";

import { AlertCircle } from "lucide-react";

import { getAdvisorsAndAdmins, getTeam } from "@/actions/teams";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { TeamForm } from "../../_components/team-form";

interface EditTeamPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditTeamPage({ params }: EditTeamPageProps) {
  const { id } = await params;
  const [teamRes, usersRes] = await Promise.all([getTeam(id), getAdvisorsAndAdmins()]);

  if (!teamRes.success || !teamRes.team) {
    notFound();
  }

  if (!usersRes.success) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 md:px-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{usersRes.error || "Failed to load user list from server."}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 md:px-6">
      <TeamForm team={teamRes.team} allUsers={usersRes.users || []} />
    </div>
  );
}
