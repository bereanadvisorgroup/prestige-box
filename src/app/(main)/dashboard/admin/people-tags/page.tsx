import { AlertCircle } from "lucide-react";

import { getTagsWithCounts } from "@/actions/tags";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { PeopleTagsTable } from "./_components/people-tags-table";

export default async function PeopleTagsPage() {
  const result = await getTagsWithCounts();

  if (!result.success) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">People Tags</h1>
          <p className="mt-2 text-muted-foreground">Manage tags and colors for people records.</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {result.error || "Failed to fetch tags from the server. Check server logs."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const tags = result.tags || [];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <PeopleTagsTable data={tags} />
    </div>
  );
}
