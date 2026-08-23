"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { BookText } from "lucide-react";
import { toast } from "sonner";

import { updateHousehold } from "@/actions/households";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Household } from "@/types/crm";

interface HouseholdNotebookButtonProps {
  household: Household;
}

export function HouseholdNotebookButton({ household }: HouseholdNotebookButtonProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [urlInput, setUrlInput] = useState(household.notebookUrl || "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const hasUrl = !!household.notebookUrl;

  const handleSave = async () => {
    const trimmed = urlInput.trim();
    if (trimmed !== "") {
      let isValid = false;
      try {
        const parsed = new URL(trimmed);
        isValid = parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch (_) {
        isValid = false;
      }

      if (!isValid) {
        setError("Please enter a valid HTTP or HTTPS URL (e.g., https://example.com)");
        return;
      }
    }

    setIsSaving(true);
    setError(null);
    try {
      const res = await updateHousehold(household.id!, {
        notebookUrl: trimmed === "" ? null : trimmed,
      });

      if (res.success) {
        toast.success("Notebook URL saved successfully.");
        setDialogOpen(false);
        router.refresh();
      } else {
        setError(res.error || "Failed to update notebook URL.");
      }
    } catch (_err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLeftClick = (e: React.MouseEvent) => {
    if (!hasUrl) {
      e.preventDefault();
      return;
    }
    window.open(household.notebookUrl!, "_blank", "noopener,noreferrer");
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setUrlInput(household.notebookUrl || "");
    setError(null);
    setDialogOpen(true);
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-9 gap-2 px-4 transition-all",
                !hasUrl && "cursor-not-allowed border-dashed opacity-50 hover:bg-background hover:text-foreground",
              )}
              onClick={handleLeftClick}
              onContextMenu={handleRightClick}
            >
              <BookText className="h-4 w-4" />
              <span>Notebook</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="start" className="max-w-xs text-xs">
            Left Click to navigate to household notebook, Right Click to edit notebook link
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Notebook Link</DialogTitle>
            <DialogDescription>
              Enter the URL for the household's notebook. Left-clicking the Notebook button will open this link in a new
              tab.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="household-notebook-url">Notebook URL</Label>
              <Input
                id="household-notebook-url"
                type="text"
                placeholder="https://example.com/notebook"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                aria-invalid={!!error}
              />
              {error && <p className="mt-1 text-destructive text-xs">{error}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
