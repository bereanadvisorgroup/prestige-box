import Link from "next/link";

import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

import { AddUserForm } from "../_components/add-user-form";

export default function NewUserPage() {
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
        <AddUserForm />
      </div>
    </div>
  );
}
