"use client";

import { useEffect, useState } from "react";

import { ArrowRight, ArrowRightLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { bulkReassignTaskCategory } from "@/actions/task-categories";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TaskCategoryWithCount } from "@/types/crm";

interface BulkReassignDialogProps {
  isOpen: boolean;
  onClose: () => void;
  categories: TaskCategoryWithCount[];
  onSuccess: () => void;
}

export function BulkReassignDialog({ isOpen, onClose, categories, onSuccess }: BulkReassignDialogProps) {
  const [sourceCategory, setSourceCategory] = useState<string>("");
  const [targetCategory, setTargetCategory] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Initialize source and target when opened
  useEffect(() => {
    if (isOpen && categories.length >= 2) {
      // Pick the category with the most tasks as initial source if possible
      const withTasks = [...categories].sort((a, b) => (b.taskCount ?? 0) - (a.taskCount ?? 0));
      const src = withTasks[0]?.name || categories[0]?.name || "";
      setSourceCategory(src);

      const tgt = categories.find((c) => c.name !== src)?.name || "";
      setTargetCategory(tgt);
    }
  }, [isOpen, categories]);

  const sourceCatObj = categories.find((c) => c.name === sourceCategory);
  const sourceTaskCount = sourceCatObj?.taskCount ?? 0;

  const targetOptions = categories.filter((c) => c.name !== sourceCategory);

  const handleSourceChange = (val: string) => {
    setSourceCategory(val);
    if (targetCategory === val) {
      const nextTarget = categories.find((c) => c.name !== val)?.name || "";
      setTargetCategory(nextTarget);
    }
  };

  const handleBulkReassign = async () => {
    if (!sourceCategory || !targetCategory || sourceCategory === targetCategory) {
      toast.error("Please select different source and target categories.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await bulkReassignTaskCategory(sourceCategory, targetCategory);
      if (result.success) {
        toast.success(`Successfully reassigned tasks from "${sourceCategory}" to "${targetCategory}"`);
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || "Failed to reassign tasks");
      }
    } catch (_error) {
      toast.error("An unexpected error occurred during bulk reassignment.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-bold text-xl">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            Bulk Reassign Tasks
          </DialogTitle>
          <DialogDescription>Move all existing tasks from one category to another in bulk.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="space-y-1.5">
            <Label htmlFor="source-category-select" className="text-xs font-semibold text-foreground">
              Source Category (From)
            </Label>
            <Select value={sourceCategory} onValueChange={handleSourceChange} disabled={isLoading}>
              <SelectTrigger id="source-category-select">
                <SelectValue placeholder="Select source category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name} ({c.taskCount ?? 0} tasks)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Currently has <span className="font-semibold text-foreground">{sourceTaskCount}</span> task
              {sourceTaskCount === 1 ? "" : "s"}.
            </p>
          </div>

          <div className="flex justify-center text-muted-foreground">
            <ArrowRight className="h-4 w-4" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="target-category-select" className="text-xs font-semibold text-foreground">
              Target Category (To)
            </Label>
            <Select value={targetCategory} onValueChange={setTargetCategory} disabled={isLoading}>
              <SelectTrigger id="target-category-select">
                <SelectValue placeholder="Select target category" />
              </SelectTrigger>
              <SelectContent>
                {targetOptions.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name} ({c.taskCount ?? 0} tasks)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleBulkReassign}
            disabled={isLoading || !sourceCategory || !targetCategory || sourceCategory === targetCategory}
            className="font-semibold shadow-sm gap-1.5"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Reassigning...
              </>
            ) : (
              `Reassign ${sourceTaskCount} Task${sourceTaskCount === 1 ? "" : "s"}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
