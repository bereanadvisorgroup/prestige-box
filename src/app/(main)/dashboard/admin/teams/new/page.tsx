import { AlertCircle } from "lucide-react";

import { getAdvisorsAndAdmins } from "@/actions/teams";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { TeamForm } from "../_components/team-form";

export default async function NewTeamPage() {
  const usersRes = await getAdvisorsAndAdmins();

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
      <TeamForm team={null} allUsers={usersRes.users || []} />
    </div>
  );
}
