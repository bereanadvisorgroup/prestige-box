"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createTeam, type TeamMemberUser, type TeamWithMembers, updateTeam } from "@/actions/teams";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { DragDropTeamMembers } from "./drag-drop-team-members";

const teamFormSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  memberUserIds: z.array(z.string()),
});

type TeamFormValues = z.infer<typeof teamFormSchema>;

interface TeamFormProps {
  team: TeamWithMembers | null;
  allUsers: TeamMemberUser[];
}

export function TeamForm({ team, allUsers }: TeamFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: team?.name ?? "",
      memberUserIds: team?.members.map((m) => m.uid) ?? [],
    },
  });

  const onSubmit = async (values: TeamFormValues) => {
    setSubmitting(true);
    try {
      if (team) {
        const res = await updateTeam(team.id, values);
        if (res.success) {
          toast.success("Team updated successfully");
          router.push("/dashboard/admin/teams");
          router.refresh();
        } else {
          toast.error(res.error || "Failed to update team");
        }
      } else {
        const res = await createTeam(values);
        if (res.success) {
          toast.success("Team created successfully");
          router.push("/dashboard/admin/teams");
          router.refresh();
        } else {
          toast.error(res.error || "Failed to create team");
        }
      }
    } catch (err) {
      toast.error((err as Error).message || "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/admin/teams")} type="button">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="flex items-center gap-2.5 font-bold text-3xl tracking-tight">
          <Users className="h-7 w-7 text-primary" />
          {team ? "Edit Team" : "Create Team"}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{team ? "Team Details" : "New Team"}</CardTitle>
          <CardDescription>
            {team
              ? "Update the team name and drag & drop advisors or admins to adjust membership."
              : "Specify a team name and drag & drop advisors or admins into the team."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Team Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Wealth Management Team" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="memberUserIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Team Members</FormLabel>
                    <FormControl>
                      <DragDropTeamMembers
                        allUsers={allUsers}
                        selectedUserIds={field.value}
                        onChange={(newUserIds) => field.onChange(newUserIds)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/admin/teams")}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {team ? "Save Changes" : "Create Team"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
