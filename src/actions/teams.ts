"use server";

import { revalidatePath } from "next/cache";

import { supabaseServer } from "@/lib/supabase.server";

export interface TeamMemberUser {
  uid: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  photoURL: string | null;
}

export interface TeamWithMembers {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string | null;
  members: TeamMemberUser[];
  memberCount: number;
  isLinked?: boolean;
}

/**
 * Helper to revalidate team-related paths across the application.
 */
function revalidateTeamPaths(teamId?: string) {
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/teams");
  if (teamId) {
    revalidatePath(`/dashboard/admin/teams/${teamId}`);
  }
  revalidatePath("/dashboard/admin/workflows");
  revalidatePath("/dashboard/crm/workflows");
}

/**
 * Fetch all teams along with their members and whether they are linked to any workflow steps.
 */
export async function getTeams(): Promise<{ success: boolean; teams?: TeamWithMembers[]; error?: string }> {
  try {
    const { data: teamsData, error: teamsError } = await supabaseServer
      .from("teams")
      .select("*")
      .order("name", { ascending: true });

    if (teamsError) throw new Error(teamsError.message);
    if (!teamsData || teamsData.length === 0) {
      return { success: true, teams: [] };
    }

    const teamIds = teamsData.map((t) => t.id);

    // Fetch team members with user profile details
    const { data: membersData, error: membersError } = await supabaseServer
      .from("team_members")
      .select("teamId, userId, users(uid, email, firstName, lastName, role, photoURL)")
      .in("teamId", teamIds);

    if (membersError) throw new Error(membersError.message);

    // Check which teams are linked to workflow template steps or instance steps
    const [templateStepsRes, instanceStepsRes] = await Promise.all([
      supabaseServer.from("workflow_template_steps").select("responsibility").in("responsibility", teamIds),
      supabaseServer.from("workflow_instance_steps").select("responsibility").in("responsibility", teamIds),
    ]);

    const linkedTeamIds = new Set<string>();
    if (templateStepsRes.data) {
      for (const row of templateStepsRes.data) {
        if (row.responsibility) linkedTeamIds.add(row.responsibility);
      }
    }
    if (instanceStepsRes.data) {
      for (const row of instanceStepsRes.data) {
        if (row.responsibility) linkedTeamIds.add(row.responsibility);
      }
    }

    // Map members by teamId
    const teamMembersMap = new Map<string, TeamMemberUser[]>();
    for (const row of membersData || []) {
      if (!row.teamId || !row.users) continue;
      const user = Array.isArray(row.users) ? row.users[0] : row.users;
      if (!user) continue;

      const memberUser: TeamMemberUser = {
        uid: user.uid,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        photoURL: user.photoURL,
      };

      const existing = teamMembersMap.get(row.teamId) || [];
      existing.push(memberUser);
      teamMembersMap.set(row.teamId, existing);
    }

    const teams: TeamWithMembers[] = teamsData.map((t) => {
      const members = teamMembersMap.get(t.id) || [];
      return {
        id: t.id,
        name: t.name,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        members,
        memberCount: members.length,
        isLinked: linkedTeamIds.has(t.id),
      };
    });

    return { success: true, teams };
  } catch (error) {
    console.error("[getTeams] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Fetch a single team by ID with member details and link status.
 */
export async function getTeam(id: string): Promise<{ success: boolean; team?: TeamWithMembers; error?: string }> {
  try {
    const { data: team, error: teamError } = await supabaseServer.from("teams").select("*").eq("id", id).single();

    if (teamError || !team) throw new Error("Team not found.");

    const { data: membersData, error: membersError } = await supabaseServer
      .from("team_members")
      .select("teamId, userId, users(uid, email, firstName, lastName, role, photoURL)")
      .eq("teamId", id);

    if (membersError) throw new Error(membersError.message);

    const members: TeamMemberUser[] = (membersData || [])
      .map((row) => {
        const user = Array.isArray(row.users) ? row.users[0] : row.users;
        if (!user) return null;
        return {
          uid: user.uid,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          photoURL: user.photoURL,
        };
      })
      .filter((u): u is TeamMemberUser => u !== null);

    const [templateStepsRes, instanceStepsRes] = await Promise.all([
      supabaseServer.from("workflow_template_steps").select("id").eq("responsibility", id).limit(1),
      supabaseServer.from("workflow_instance_steps").select("id").eq("responsibility", id).limit(1),
    ]);

    const isLinked =
      (templateStepsRes.data && templateStepsRes.data.length > 0) ||
      (instanceStepsRes.data && instanceStepsRes.data.length > 0);

    return {
      success: true,
      team: {
        id: team.id,
        name: team.name,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
        members,
        memberCount: members.length,
        isLinked: !!isLinked,
      },
    };
  } catch (error) {
    console.error("[getTeam] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Fetch all users with role 'admin' or 'advisor'.
 */
export async function getAdvisorsAndAdmins(): Promise<{ success: boolean; users?: TeamMemberUser[]; error?: string }> {
  try {
    const { data, error } = await supabaseServer
      .from("users")
      .select("uid, email, firstName, lastName, role, photoURL")
      .in("role", ["admin", "advisor"])
      .order("firstName", { ascending: true });

    if (error) throw new Error(error.message);

    return { success: true, users: data || [] };
  } catch (error) {
    console.error("[getAdvisorsAndAdmins] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Create a new team with member user IDs.
 */
export async function createTeam(data: {
  name: string;
  memberUserIds: string[];
}): Promise<{ success: boolean; teamId?: string; error?: string }> {
  try {
    const name = data.name.trim();
    if (!name) throw new Error("Team name is required.");

    const { data: newTeam, error: teamError } = await supabaseServer
      .from("teams")
      .insert({ name })
      .select("id")
      .single();

    if (teamError || !newTeam) throw new Error(teamError?.message || "Failed to create team.");

    if (data.memberUserIds && data.memberUserIds.length > 0) {
      const uniqueUserIds = [...new Set(data.memberUserIds)];
      const memberInserts = uniqueUserIds.map((userId) => ({
        teamId: newTeam.id,
        userId,
      }));

      const { error: membersError } = await supabaseServer.from("team_members").insert(memberInserts);
      if (membersError) throw new Error(`Team created, but failed to add members: ${membersError.message}`);
    }

    revalidateTeamPaths(newTeam.id);
    return { success: true, teamId: newTeam.id };
  } catch (error) {
    console.error("[createTeam] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Update an existing team and sync member user IDs.
 */
export async function updateTeam(
  id: string,
  data: { name: string; memberUserIds: string[] },
): Promise<{ success: boolean; error?: string }> {
  try {
    const name = data.name.trim();
    if (!name) throw new Error("Team name is required.");

    const { error: updateError } = await supabaseServer
      .from("teams")
      .update({ name, updatedAt: new Date().toISOString() })
      .eq("id", id);

    if (updateError) throw new Error(updateError.message);

    // Synchronize members: remove existing members and insert new list
    const { error: deleteMembersError } = await supabaseServer.from("team_members").delete().eq("teamId", id);
    if (deleteMembersError) throw new Error(deleteMembersError.message);

    if (data.memberUserIds && data.memberUserIds.length > 0) {
      const uniqueUserIds = [...new Set(data.memberUserIds)];
      const memberInserts = uniqueUserIds.map((userId) => ({
        teamId: id,
        userId,
      }));

      const { error: insertMembersError } = await supabaseServer.from("team_members").insert(memberInserts);
      if (insertMembersError) throw new Error(`Failed to update team members: ${insertMembersError.message}`);
    }

    revalidateTeamPaths(id);
    return { success: true };
  } catch (error) {
    console.error("[updateTeam] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Delete a team if it is not linked to workflow steps or templates.
 */
export async function deleteTeam(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Safety check for links
    const [templateStepsRes, instanceStepsRes] = await Promise.all([
      supabaseServer.from("workflow_template_steps").select("id").eq("responsibility", id).limit(1),
      supabaseServer.from("workflow_instance_steps").select("id").eq("responsibility", id).limit(1),
    ]);

    if (
      (templateStepsRes.data && templateStepsRes.data.length > 0) ||
      (instanceStepsRes.data && instanceStepsRes.data.length > 0)
    ) {
      throw new Error("Cannot delete team because it is linked to active workflow steps or templates.");
    }

    const { error } = await supabaseServer.from("teams").delete().eq("id", id);
    if (error) throw new Error(error.message);

    revalidateTeamPaths(id);
    return { success: true };
  } catch (error) {
    console.error("[deleteTeam] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Fetch all team IDs that a specific user belongs to.
 */
export async function getUserTeamIds(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabaseServer.from("team_members").select("teamId").eq("userId", userId);

    if (error) throw new Error(error.message);
    return (data || []).map((row) => row.teamId);
  } catch (error) {
    console.error("[getUserTeamIds] Error:", error);
    return [];
  }
}
