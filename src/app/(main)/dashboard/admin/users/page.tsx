import Link from "next/link";

import { AlertCircle, Plus } from "lucide-react";

import { getUsers } from "@/actions/users";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { UserProfile } from "@/stores/auth.store";

import { UsersTable } from "./_components/users-table";

export default async function ManageUsersPage() {
  const result = await getUsers();

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

  const users = result.users as UserProfile[];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Manage Users</h1>
          <p className="mt-2 text-muted-foreground">
            View, edit, and manage all users and their permissions within the system.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/admin/users/new">
            <Plus className="mr-2 h-4 w-4" />
            Add New User
          </Link>
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-xl">User List</h2>
        </div>
        <UsersTable data={users} />
      </div>
    </div>
  );
}
