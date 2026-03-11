import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AddUserForm } from "../_components/add-user-form";

export default function NewUserPage() {
  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto py-8 px-4 md:px-6">
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" asChild className="w-fit -ml-2 text-muted-foreground">
          <Link href="/dashboard/admin/users">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New User</h1>
          <p className="text-muted-foreground mt-2">
            Create a new user account and assign them a role.
          </p>
        </div>
      </div>

      <div className="border rounded-xl p-6 bg-card text-card-foreground shadow-sm">
        <AddUserForm />
      </div>
    </div>
  );
}
