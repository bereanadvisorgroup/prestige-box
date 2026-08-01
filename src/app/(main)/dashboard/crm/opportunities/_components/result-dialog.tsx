"use client";

import * as React from "react";

import { Loader2 } from "lucide-react";

import { updateOpportunity } from "@/actions/opportunities";
import { RichTextEditor } from "@/components/features/tasks/rich-text-editor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunityId: string | null;
  opportunityName: string;
  resultStatus: "WON" | "LOST" | "TRASH" | null;
  onSaved?: () => void;
}

export function ResultDialog({
  open,
  onOpenChange,
  opportunityId,
  opportunityName,
  resultStatus,
  onSaved,
}: ResultDialogProps) {
  const [isSaving, setIsSaving] = React.useState(false);
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setNotes("");
    }
  }, [open]);

  async function handleConfirm() {
    if (!opportunityId || !resultStatus) return;
    setIsSaving(true);
    try {
      const result = await updateOpportunity(opportunityId, {
        resultStatus,
        resultNotes: notes,
      });

      if (result.success) {
        onOpenChange(false);
        onSaved?.();
      } else {
        console.error("Failed to update opportunity result:", result.error);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  }

  const getStatusColor = () => {
    switch (resultStatus) {
      case "WON":
        return "text-emerald-600";
      case "LOST":
        return "text-rose-600";
      case "TRASH":
        return "text-amber-600";
      default:
        return "text-primary";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            Close Opportunity as <span className={getStatusColor()}>{resultStatus}</span>
          </DialogTitle>
          <DialogDescription>
            You are moving <span className="font-semibold text-foreground">{opportunityName}</span> to{" "}
            <span className="font-semibold">{resultStatus}</span>. Please fill in the result notes below.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-2">
          <label className="text-sm font-semibold text-muted-foreground">Notes / Reason</label>
          <RichTextEditor
            value={notes}
            onChange={setNotes}
            placeholder={`Provide a reason for marking this opportunity as ${resultStatus}...`}
          />
        </div>

        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save & Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
