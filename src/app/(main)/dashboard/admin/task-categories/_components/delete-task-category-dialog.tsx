"use client";

import { useEffect, useState } from "react";

import { AlertTriangle } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TaskCategoryWithCount } from "@/types/crm";

interface DeleteTaskCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reassignToCategoryName?: string) => Promise<void>;
  isLoading: boolean;
  category: TaskCategoryWithCount | null;
  allCategories: TaskCategoryWithCount[];
}

export function DeleteTaskCategoryDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  category,
  allCategories,
}: DeleteTaskCategoryDialogProps) {
  const [reassignCategory, setReassignCategory] = useState<string>("");

  const taskCount = category?.taskCount ?? 0;
  const hasTasks = taskCount > 0;

  // Other available categories to reassign tasks to
  const availableTargetCategories = allCategories.filter((c) => c.id !== category?.id);

  // Auto-select first available category when opened if tasks exist
  // biome-ignore lint/correctness/useExhaustiveDependencies: Initialize default target category on dialog open
  useEffect(() => {
    if (isOpen && hasTasks && availableTargetCategories.length > 0) {
      // Prefer 'Other' if available, otherwise first option
      const defaultOption = availableTargetCategories.find((c) => c.name === "Other") || availableTargetCategories[0];
      setReassignCategory(defaultOption.name);
    } else {
      setReassignCategory("");
    }
  }, [isOpen, hasTasks, category?.id]);

  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    if (hasTasks && !reassignCategory) return;
    onConfirm(hasTasks ? reassignCategory : undefined);
  };

  if (!category) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Task Category
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 pt-2 text-left text-muted-foreground text-sm">
              <div>
                Are you sure you want to delete the category{" "}
                <strong className="text-foreground">{category.name}</strong>?
              </div>

              {hasTasks ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900 text-xs dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200 space-y-2">
                  <div className="font-semibold">
                    This category is currently assigned to {taskCount} task{taskCount === 1 ? "" : "s"}.
                  </div>
                  <div>
                    To delete this category without leaving orphaned tasks, please select a replacement category to
                    reassign these tasks to:
                  </div>
                  <div className="pt-2 space-y-1.5">
                    <Label htmlFor="reassign-category-select" className="text-xs font-semibold text-foreground">
                      Reassign {taskCount} task{taskCount === 1 ? "" : "s"} to:
                    </Label>
                    <Select value={reassignCategory} onValueChange={setReassignCategory}>
                      <SelectTrigger id="reassign-category-select" className="bg-background text-foreground">
                        <SelectValue placeholder="Select target category..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTargetCategories.map((c) => (
                          <SelectItem key={c.id} value={c.name}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground text-xs">
                  There are currently no tasks assigned to this category. This action cannot be undone.
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="pt-2">
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading || (hasTasks && (!reassignCategory || availableTargetCategories.length === 0))}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold shadow-sm"
          >
            {isLoading ? "Deleting..." : hasTasks ? "Reassign & Delete" : "Delete Category"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
