"use client";

import * as React from "react";

import Link from "next/link";

import { Plus, Users } from "lucide-react";

import { getTeams, type TeamWithMembers } from "@/actions/teams";
import { Button } from "@/components/ui/button";

import { TeamsTable } from "./_components/teams-table";

interface TeamsClientViewProps {
  initialTeams: TeamWithMembers[];
}

export function TeamsClientView({ initialTeams }: TeamsClientViewProps) {
  const [teams, setTeams] = React.useState<TeamWithMembers[]>(initialTeams);

  const refreshTeams = React.useCallback(async () => {
    const res = await getTeams();
    if (res.success && res.teams) {
      setTeams(res.teams);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2.5 font-bold text-3xl tracking-tight">
            <Users className="h-7 w-7 text-primary" />
            Teams
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Create teams consisting of Advisors and Admins to assign workflow step responsibilities.
          </p>
        </div>
        <Button asChild className="shrink-0 gap-2">
          <Link href="/dashboard/admin/teams/new">
            <Plus className="h-4 w-4" />
            Create Team
          </Link>
        </Button>
      </div>

      <TeamsTable teams={teams} onRefresh={refreshTeams} />
    </div>
  );
}
