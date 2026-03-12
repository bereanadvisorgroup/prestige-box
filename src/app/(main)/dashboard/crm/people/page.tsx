import Link from "next/link";

import { AlertCircle, Plus, UserIcon } from "lucide-react";

import { getPeople } from "@/actions/people";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import { PeopleTable } from "./_components/people-table";

export default async function PeoplePage() {
  const result = await getPeople();

  if (!result.success) {
    return (
      <div className="flex flex-col gap-10 w-full max-w-6xl mx-auto py-8 px-4 md:px-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">People</h1>
          <p className="text-muted-foreground mt-2">Manage people in the system.</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {result.error || "Failed to fetch people from the server. Check server logs for details."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const people = result.people || [];

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto py-8 px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">People</h1>
          <p className="text-muted-foreground mt-2">View, add, and manage individuals in your CRM.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/crm/people/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Person
          </Link>
        </Button>
      </div>

      <div className="space-y-4">
        <PeopleTable data={people} />
      </div>
    </div>
  );
}
