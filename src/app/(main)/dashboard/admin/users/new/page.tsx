import Link from "next/link";

import { ChevronLeft } from "lucide-react";

import { getClients } from "@/actions/clients";
import { getUsers } from "@/actions/users";
import { Button } from "@/components/ui/button";

import { AddUserForm } from "../_components/add-user-form";

export default async function NewUserPage() {
  const [clientsRes, usersRes] = await Promise.all([getClients(), getUsers()]);

  const clients = clientsRes.success && clientsRes.clients ? clientsRes.clients : [];
  const users = usersRes.success && usersRes.users ? usersRes.users : [];

  const userEmails = new Set(users.map((u) => u.email.toLowerCase()));

  const unlinkedClients = clients.filter((client) => {
    const emails = client.person?.emails || [];
    // Client must have at least one email, and none of their emails should match an existing user
    return emails.length > 0 && !emails.some((e: any) => userEmails.has(e.address.toLowerCase()));
  });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8 md:px-6">
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit text-muted-foreground">
          <Link href="/dashboard/admin/users">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Link>
        </Button>
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Add New User</h1>
          <p className="mt-2 text-muted-foreground">Create a new user account and assign them a role.</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
        <AddUserForm unlinkedClients={unlinkedClients} />
      </div>
    </div>
  );
}
