"use client";

import Link from "next/link";

import { format } from "date-fns";
import { ArrowLeft, Calendar, Pencil, Shield, User, Users } from "lucide-react";

import type { TeamWithMembers } from "@/actions/teams";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface TeamDetailClientProps {
  initialTeam: TeamWithMembers;
}

export function TeamDetailClient({ initialTeam }: TeamDetailClientProps) {
  const team = initialTeam;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/admin/teams"
          className="mb-3 inline-flex items-center gap-1.5 text-muted-foreground text-xs transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Teams
        </Link>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="flex items-center gap-3 font-bold text-3xl tracking-tight">
              <Users className="h-8 w-8 shrink-0 text-primary" />
              {team.name}
            </h1>
            <p className="mt-1 flex items-center gap-2 text-muted-foreground text-xs">
              <Calendar className="h-3.5 w-3.5" />
              Created on {format(new Date(team.createdAt), "MMMM d, yyyy")}
            </p>
          </div>
          <Button asChild variant="outline" className="shrink-0 gap-2">
            <Link href={`/dashboard/admin/teams/${team.id}/edit`}>
              <Pencil className="h-4 w-4" />
              Edit Team
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between font-bold text-lg">
              <span>Team Members</span>
              <Badge variant="secondary">{team.memberCount} total</Badge>
            </CardTitle>
            <CardDescription>
              Advisors and Admins currently assigned to this team. Workflow steps assigned to this team will appear in
              their My Workflow Steps tasks card.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {team.members.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                <Users className="mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="font-medium text-sm">No members in this team</p>
                <p className="mt-1 text-muted-foreground text-xs">Click Edit Team to add members.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {team.members.map((member) => {
                  const fullName = `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim() || member.email;
                  const initials =
                    (member.firstName?.[0] || "") + (member.lastName?.[0] || "") || member.email[0].toUpperCase();

                  return (
                    <div
                      key={member.uid}
                      className="flex items-center gap-3 rounded-lg border bg-card/50 p-3 transition-colors hover:bg-muted/30"
                    >
                      <Avatar className="h-10 w-10 shrink-0 border">
                        <AvatarImage src={member.photoURL || undefined} alt={fullName} />
                        <AvatarFallback className="font-semibold text-xs">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-sm leading-tight">{fullName}</p>
                        <p className="truncate text-muted-foreground text-xs">{member.email}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0 gap-1 text-[10px] capitalize">
                        {member.role === "admin" ? (
                          <Shield className="h-2.5 w-2.5 text-purple-600" />
                        ) : (
                          <User className="h-2.5 w-2.5 text-blue-600" />
                        )}
                        {member.role}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-bold text-lg">Team Overview</CardTitle>
            <CardDescription>Details & workflow status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground">Status:</span>
              <Badge className="border-none bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Active
              </Badge>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground">Workflow Linking:</span>
              <span className="font-semibold">{team.isLinked ? "Linked to steps/templates" : "Unlinked"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Members:</span>
              <span className="font-bold text-sm">{team.memberCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
