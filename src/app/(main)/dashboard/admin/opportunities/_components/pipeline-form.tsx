"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, GitFork } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as z from "zod";

import { createOpportunityPipeline, updateOpportunityPipeline } from "@/actions/opportunity-pipelines";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { type OpportunityPipeline, OpportunityPipelineSchema } from "@/types/crm";

import { StagesSortableList } from "./stages-sortable-list";

interface PipelineFormProps {
  pipeline?: OpportunityPipeline;
}

export function PipelineForm({ pipeline }: PipelineFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(OpportunityPipelineSchema),
    defaultValues: pipeline
      ? {
          id: pipeline.id,
          name: pipeline.name,
          isActive: pipeline.isActive,
          stages: pipeline.stages || [],
        }
      : {
          name: "",
          isActive: true,
          stages: [
            { name: "", order: 0 },
          ],
        },
  });

  const onSubmit = async (values: any) => {
    setIsLoading(true);
    try {
      if (pipeline?.id) {
        // Edit mode
        const result = await updateOpportunityPipeline(pipeline.id, values);
        if (result.success) {
          toast.success("Opportunity Pipeline updated successfully");
          router.push("/dashboard/admin/opportunities");
          router.refresh();
        } else {
          toast.error(result.error || "Failed to update pipeline");
        }
      } else {
        // Create mode
        const result = await createOpportunityPipeline(values);
        if (result.success) {
          toast.success("Opportunity Pipeline added successfully");
          router.push("/dashboard/admin/opportunities");
          router.refresh();
        } else {
          toast.error(result.error || "Failed to add pipeline");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/admin/opportunities")}
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
              <GitFork className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="font-bold text-xl">{pipeline ? "Edit Pipeline" : "Add Pipeline"}</CardTitle>
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
                      <FormLabel className="font-semibold text-foreground">Pipeline Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Existing Clients, Sales Process"
                          disabled={isLoading}
                          className="bg-background"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Give your pipeline a clear descriptive name.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base font-semibold">Active Status</FormLabel>
                        <FormDescription>
                          Determines if this pipeline is available to assign new opportunities.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isLoading} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stages"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormControl>
                        <StagesSortableList stages={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading}
                    onClick={() => router.push("/dashboard/admin/opportunities")}
                    className="font-medium"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading} className="font-semibold shadow-sm">
                    {isLoading ? "Saving..." : pipeline ? "Save Changes" : "Create Pipeline"}
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
