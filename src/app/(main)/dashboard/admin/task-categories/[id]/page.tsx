import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowLeft, Calendar, Edit, ListFilter } from "lucide-react";

import { getTaskCategory } from "@/actions/task-categories";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface TaskCategoryDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TaskCategoryDetailsPage({ params }: TaskCategoryDetailsPageProps) {
  const { id } = await params;
  const result = await getTaskCategory(id);

  if (!result.success || !result.taskCategory) {
    notFound();
  }

  const { taskCategory, taskCount } = result;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ListFilter className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-bold text-3xl tracking-tight">{taskCategory.name}</h1>
            <p className="text-muted-foreground text-sm">Task Category Details</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline" className="font-semibold shadow-sm">
            <Link href="/dashboard/admin/task-categories">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to List
            </Link>
          </Button>
          <Button asChild className="font-semibold shadow-sm">
            <Link href={`/dashboard/admin/task-categories/${taskCategory.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Category
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="h-fit border shadow-sm md:col-span-2">
          <CardHeader>
            <CardTitle className="font-bold text-lg">Category Info & Usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 py-2">
              <span className="font-medium text-muted-foreground text-sm">Record ID</span>
              <span className="col-span-2 break-all font-mono text-foreground text-sm">{taskCategory.id}</span>
            </div>
            <Separator />
            <div className="grid grid-cols-3 py-2">
              <span className="font-medium text-muted-foreground text-sm">Category Name</span>
              <span className="col-span-2 font-semibold text-foreground text-sm">{taskCategory.name}</span>
            </div>
            <Separator />
            <div className="grid grid-cols-3 py-2">
              <span className="font-medium text-muted-foreground text-sm">Tasks Assigned</span>
              <span className="col-span-2 text-foreground text-sm">
                <Badge
                  variant="outline"
                  className={
                    (taskCount ?? 0) > 0
                      ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
                      : "bg-muted text-muted-foreground"
                  }
                >
                  {taskCount ?? 0} {taskCount === 1 ? "task" : "tasks"}
                </Badge>
              </span>
            </div>
            <Separator />
            <div className="grid grid-cols-3 py-2">
              <span className="flex items-center gap-1.5 font-medium text-muted-foreground text-sm">
                <Calendar className="h-4 w-4" />
                Created At
              </span>
              <span className="col-span-2 text-foreground text-sm">
                {taskCategory.createdAt ? new Date(taskCategory.createdAt).toLocaleString() : "-"}
              </span>
            </div>
            <Separator />
            <div className="grid grid-cols-3 py-2">
              <span className="flex items-center gap-1.5 font-medium text-muted-foreground text-sm">
                <Calendar className="h-4 w-4" />
                Last Updated
              </span>
              <span className="col-span-2 text-foreground text-sm">
                {taskCategory.updatedAt ? new Date(taskCategory.updatedAt).toLocaleString() : "-"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
