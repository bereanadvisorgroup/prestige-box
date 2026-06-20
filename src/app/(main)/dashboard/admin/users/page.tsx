import Link from "next/link";

import { AlertCircle, Plus } from "lucide-react";

import { getUsers } from "@/actions/users";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { supabaseServer } from "@/lib/supabase.server";

import { UsersTable } from "./_components/users-table";

export default async function ManageUsersPage() {
  const [
    result,
    {
      data: { user: currentUser },
    },
  ] = await Promise.all([getUsers(), supabaseServer.auth.getUser()]);

  if (!result.success) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Manage Users</h1>
          <p className="mt-2 text-muted-foreground">Error loading users.</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {result.error || "Failed to fetch users from the server. Check server logs for details."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const currentUid = currentUser?.id;
  const users = (result.users || []).map((user) => ({
    ...user,
    isLinked: user.uid === currentUid,
    userName: `${user.firstName} ${user.lastName}`,
  }));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-6">
      <UsersTable data={users} />
    </div>
  );
}
