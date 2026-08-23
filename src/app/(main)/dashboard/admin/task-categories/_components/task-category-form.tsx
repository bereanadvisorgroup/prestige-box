"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Info, ListFilter } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as z from "zod";

import { createTaskCategory, updateTaskCategory } from "@/actions/task-categories";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { type TaskCategory, TaskCategorySchema } from "@/types/crm";

interface TaskCategoryFormProps {
  taskCategory?: TaskCategory;
}

export function TaskCategoryForm({ taskCategory }: TaskCategoryFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof TaskCategorySchema>>({
    resolver: zodResolver(TaskCategorySchema),
    defaultValues: taskCategory
      ? {
          id: taskCategory.id,
          name: taskCategory.name,
        }
      : {
          name: "",
        },
  });

  const onSubmit = async (values: z.infer<typeof TaskCategorySchema>) => {
    setIsLoading(true);
    try {
      if (taskCategory?.id) {
        // Edit mode
        const result = await updateTaskCategory(taskCategory.id, values);
        if (result.success) {
          toast.success("Task category updated successfully");
          router.push("/dashboard/admin/task-categories");
          router.refresh();
        } else {
          toast.error(result.error || "Failed to update task category");
        }
      } else {
        // Create mode
        const result = await createTaskCategory(values);
        if (result.success) {
          toast.success("Task category created successfully");
          router.push("/dashboard/admin/task-categories");
          router.refresh();
        } else {
          toast.error(result.error || "Failed to create task category");
        }
      }
    } catch (_error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/dashboard/admin/task-categories")}
          className="group text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to list
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border bg-card lg:col-span-2">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ListFilter className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="font-bold text-xl">
                {taskCategory ? "Edit Task Category" : "Add Task Category"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-foreground">Category Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Client Review"
                          disabled={isLoading}
                          className="bg-background"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>The unique name of the task category.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {taskCategory && (
                  <Alert className="border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertDescription className="text-xs">
                      Renaming this category will automatically update all existing tasks currently labeled as{" "}
                      <strong>&quot;{taskCategory.name}&quot;</strong> to the new name.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end gap-3 border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading}
                    onClick={() => router.push("/dashboard/admin/task-categories")}
                    className="font-medium"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading} className="font-semibold shadow-sm">
                    {isLoading ? "Saving..." : taskCategory ? "Save Changes" : "Add Category"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
