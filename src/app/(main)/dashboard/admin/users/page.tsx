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
      <div className="flex flex-col gap-10 w-full max-w-6xl mx-auto py-8 px-4 md:px-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Users</h1>
          <p className="text-muted-foreground mt-2">Error loading users.</p>
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
    <div className="flex flex-col gap-10 w-full max-w-6xl mx-auto py-8 px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Users</h1>
          <p className="text-muted-foreground mt-2">
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
          <h2 className="text-xl font-semibold">User List</h2>
        </div>
        <UsersTable data={users} />
      </div>
    </div>
  );
}
