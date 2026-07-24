import { AlertCircle } from "lucide-react";

import { getTeams } from "@/actions/teams";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { TeamsClientView } from "./teams-client-view";

export default async function AdminTeamsPage() {
  const teamsRes = await getTeams();

  if (!teamsRes.success) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Teams</h1>
          <p className="mt-1 text-muted-foreground text-sm">Error loading teams dashboard.</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{teamsRes.error || "Failed to load teams from server."}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-6">
      <TeamsClientView initialTeams={teamsRes.teams || []} />
    </div>
  );
}
