"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Tag as TagIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { createTag, updateTag } from "@/actions/tags";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ColorPicker } from "@/components/ui/color-picker";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { Tag } from "@/types/crm";

const TagFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Tag name cannot be empty"),
  color: z.string().min(1, "Tag color is required"),
});

type TagFormValues = z.infer<typeof TagFormSchema>;

interface TagFormProps {
  tag?: Tag;
}

export function TagForm({ tag }: TagFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<TagFormValues>({
    resolver: zodResolver(TagFormSchema),
    defaultValues: tag
      ? {
          id: tag.id,
          name: tag.name,
          color: tag.color || "#64748B",
        }
      : {
          name: "",
          color: "#3B82F6",
        },
  });

  const watchedName = form.watch("name");
  const watchedColor = form.watch("color") || "#64748B";

  const onSubmit = async (values: TagFormValues) => {
    setIsLoading(true);
    try {
      if (tag?.id) {
        // Edit mode
        const result = await updateTag(tag.id, {
          name: values.name,
          color: values.color,
        });
        if (result.success) {
          toast.success("Tag updated successfully");
          router.push("/dashboard/admin/people-tags");
          router.refresh();
        } else {
          toast.error(result.error || "Failed to update tag");
        }
      } else {
        // Create mode
        const result = await createTag({
          name: values.name,
          color: values.color,
        });
        if (result.success) {
          toast.success("Tag created successfully");
          router.push("/dashboard/admin/people-tags");
          router.refresh();
        } else {
          toast.error(result.error || "Failed to create tag");
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
          onClick={() => router.push("/dashboard/admin/people-tags")}
          className="group text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to list
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border bg-card lg:col-span-2">
          <CardHeader className="flex flex-row items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg shadow-2xs"
              style={{
                backgroundColor: `${watchedColor}1A`,
                color: watchedColor,
              }}
            >
              <TagIcon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="font-bold text-xl">{tag ? "Edit People Tag" : "Add People Tag"}</CardTitle>
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
                      <FormLabel className="font-semibold text-foreground">Tag Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., VIP Client, Trustee, Prospect"
                          disabled={isLoading}
                          className="bg-background"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>The unique name of the tag used across people records.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-foreground">Tag Color</FormLabel>
                      <FormControl>
                        <ColorPicker
                          value={field.value}
                          onChange={field.onChange}
                          disabled={isLoading}
                          tagNamePreview={watchedName}
                        />
                      </FormControl>
                      <FormDescription>Choose a palette swatch or specify a custom hex code.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Live Preview Box */}
                <div className="rounded-lg border border-border/80 bg-muted/30 p-4">
                  <span className="font-medium text-[11px] text-muted-foreground uppercase tracking-wider">
                    Visual Preview in CRM
                  </span>
                  <div className="mt-2.5 flex items-center gap-3">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium text-xs shadow-2xs"
                      style={{
                        backgroundColor: `${watchedColor}1A`,
                        borderColor: `${watchedColor}45`,
                        color: watchedColor,
                      }}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: watchedColor }} />
                      <span>{watchedName?.trim() ? watchedName.trim() : "Tag Name"}</span>
                    </span>
                    <span className="text-muted-foreground text-xs">
                      (How this badge appears in People directories and detail profiles)
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading}
                    onClick={() => router.push("/dashboard/admin/people-tags")}
                    className="font-medium"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading} className="font-semibold shadow-xs">
                    {isLoading ? "Saving..." : tag ? "Save Changes" : "Create Tag"}
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
