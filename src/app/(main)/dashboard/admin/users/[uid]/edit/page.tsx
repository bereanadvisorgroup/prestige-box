import Link from "next/link";
import { notFound } from "next/navigation";

import { ChevronLeft } from "lucide-react";

import { getUser } from "@/actions/users";
import { Button } from "@/components/ui/button";
import type { UserProfile } from "@/stores/auth.store";

import { EditUserForm } from "../../_components/edit-user-form";

interface EditUserPageProps {
  params: Promise<{ uid: string }>;
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const { uid } = await params;
  const result = await getUser(uid);

  if (!result.success || !result.user) {
    notFound();
  }

  const user = result.user as UserProfile;

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
          <h1 className="font-bold text-3xl tracking-tight">Edit User</h1>
          <p className="mt-2 text-muted-foreground">
            Update profile information for {user.firstName} {user.lastName}.
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
        <EditUserForm user={user} />
      </div>
    </div>
  );
}
