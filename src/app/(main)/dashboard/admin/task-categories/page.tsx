import { AlertCircle } from "lucide-react";

import { getTaskCategoriesWithCounts } from "@/actions/task-categories";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { TaskCategoriesTable } from "./_components/task-categories-table";

export default async function TaskCategoriesPage() {
  const result = await getTaskCategoriesWithCounts();

  if (!result.success) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Task Categories</h1>
          <p className="mt-2 text-muted-foreground">Manage task categories.</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {result.error || "Failed to fetch task categories from the server. Check server logs."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const taskCategories = result.taskCategories || [];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <TaskCategoriesTable data={taskCategories} />
    </div>
  );
}
