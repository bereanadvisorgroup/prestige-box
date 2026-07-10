"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { Loader2, Workflow } from "lucide-react";
import { toast } from "sonner";

import { getWorkflowTemplates } from "@/actions/workflow-templates";
import { createWorkflowFromTemplate } from "@/actions/workflows";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { WorkflowEntityType, WorkflowTemplateListItem } from "@/types/workflows";

interface CreateWorkflowDialogProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: WorkflowEntityType;
  entityId: string;
}

export function CreateWorkflowDialog({ isOpen, onClose, entityType, entityId }: CreateWorkflowDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [templates, setTemplates] = useState<WorkflowTemplateListItem[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      try {
        const result = await getWorkflowTemplates();
        if (!cancelled && result.success) {
          setTemplates(result.templates || []);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const handleSelect = async (template: WorkflowTemplateListItem) => {
    if (isCreating) return;

    setIsCreating(true);
    try {
      const result = await createWorkflowFromTemplate(template.id, entityType, entityId);
      if (result.success && result.id) {
        toast.success(`Workflow "${template.name}" created`);
        onClose();
        router.refresh();
      } else {
        toast.error(result.error || "Failed to create workflow");
      }
    } catch (_error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Workflow</DialogTitle>
          <DialogDescription>Select a workflow template to start.</DialogDescription>
        </DialogHeader>
        {isLoading || isCreating ? (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            {isCreating ? "Creating workflow..." : "Loading workflow templates..."}
          </div>
        ) : (
          <Command className="rounded-md border">
            <CommandInput placeholder="Search workflows..." />
            <CommandList className="max-h-72">
              <CommandEmpty>No workflow templates found.</CommandEmpty>
              <CommandGroup>
                {templates.map((template) => (
                  <CommandItem
                    key={template.id}
                    value={`${template.name}-${template.id}`}
                    onSelect={() => handleSelect(template)}
                  >
                    <Workflow className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="flex-1">{template.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {template.stepCount} step{template.stepCount === 1 ? "" : "s"}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        )}
      </DialogContent>
    </Dialog>
  );
}
