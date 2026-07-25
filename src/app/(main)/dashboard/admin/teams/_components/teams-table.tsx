"use client";

import * as React from "react";

import Link from "next/link";

import { format } from "date-fns";
import { ArrowUpRight, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { deleteTeam, type TeamWithMembers } from "@/actions/teams";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TeamsTableProps {
  teams: TeamWithMembers[];
  onRefresh: () => void;
}

export function TeamsTable({ teams, onRefresh }: TeamsTableProps) {
  const [deleteTarget, setDeleteTarget] = React.useState<TeamWithMembers | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await deleteTeam(deleteTarget.id);
      if (res.success) {
        toast.success("Team deleted successfully");
        onRefresh();
      } else {
        toast.error(res.error || "Failed to delete team");
      }
    } catch (err) {
      toast.error((err as Error).message || "An unexpected error occurred");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card p-8 text-center">
        <Users className="mb-3 h-10 w-10 text-muted-foreground/50" />
        <h3 className="font-semibold text-lg">No teams created yet</h3>
        <p className="mt-1 max-w-sm text-muted-foreground text-sm">
          Create teams of advisors and admins to assign workflow responsibilities.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="font-bold">Team Name</TableHead>
              <TableHead className="font-bold">Members</TableHead>
              <TableHead className="font-bold">Created Date</TableHead>
              <TableHead className="w-[120px] text-right font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.map((team) => (
              <TableRow key={team.id} className="transition-colors hover:bg-muted/30">
                {/* First Column: Team Name linking to detailed page + ArrowUpRight icon */}
                <TableCell className="font-medium">
                  <Link
                    href={`/dashboard/admin/teams/${team.id}`}
                    className="group inline-flex items-center gap-1.5 font-semibold text-foreground transition-colors hover:text-primary"
                  >
                    <span>{team.name}</span>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary group-hover:opacity-100" />
                  </Link>
                </TableCell>

                {/* Members Column: Avatars Stack & Count Badge */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    {team.members.length === 0 ? (
                      <span className="text-muted-foreground text-xs italic">No members assigned</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2 overflow-hidden">
                          {team.members.slice(0, 5).map((member) => {
                            const name = `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim() || member.email;
                            const initials =
                              (member.firstName?.[0] || "") + (member.lastName?.[0] || "") ||
                              member.email[0].toUpperCase();

                            return (
                              <TooltipProvider key={member.uid}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Avatar className="h-7 w-7 shrink-0 border-2 border-background ring-1 ring-muted">
                                      <AvatarImage src={member.photoURL || undefined} alt={name} />
                                      <AvatarFallback className="font-semibold text-[10px]">{initials}</AvatarFallback>
                                    </Avatar>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="font-medium">{name}</p>
                                    <p className="text-[11px] text-muted-foreground capitalize">{member.role}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            );
                          })}
                        </div>
                        <Badge variant="secondary" className="px-2 py-0.5 font-normal text-[11px]">
                          {team.memberCount} {team.memberCount === 1 ? "member" : "members"}
                        </Badge>
                      </div>
                    )}
                  </div>
                </TableCell>

                {/* Created Date */}
                <TableCell className="text-muted-foreground text-xs">
                  {format(new Date(team.createdAt), "MMM d, yyyy")}
                </TableCell>

                {/* Direct Actions (Last Column): Pencil & Trash2 (Conditional delete) */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground"
                      asChild
                      title="Edit Team"
                    >
                      <Link href={`/dashboard/admin/teams/${team.id}/edit`}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit Team</span>
                      </Link>
                    </Button>

                    {team.isLinked ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-block cursor-not-allowed">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 cursor-not-allowed text-muted-foreground/40 hover:bg-transparent"
                                disabled
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete Team (Disabled)</span>
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">
                              Team is linked to workflow steps or templates and cannot be deleted.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setDeleteTarget(team)}
                        title="Delete Team"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete Team</span>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this team?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the team <strong>&quot;{deleteTarget?.name}&quot;</strong> and remove
              its member assignments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete Team"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
