"use client";

import * as React from "react";

import { PhoneCall } from "lucide-react";
import { toast } from "sonner";

import { logProspectCall } from "@/actions/prospects";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { EnrichedProspect } from "@/types/prospects";

interface QuickCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prospect: EnrichedProspect | null;
  onSuccess?: () => void;
}

export function QuickCallDialog({ open, onOpenChange, prospect, onSuccess }: QuickCallDialogProps) {
  const [outcome, setOutcome] = React.useState("Connected - Positive");
  const [duration, setDuration] = React.useState("15");
  const [notes, setNotes] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (!prospect) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await logProspectCall({
        prospectId: prospect.id!,
        prospectName: `${prospect.firstName} ${prospect.lastName}`,
        outcome,
        durationMinutes: Number(duration) || 5,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        toast.success(`Call logged for ${prospect.firstName} ${prospect.lastName}.`);
        onOpenChange(false);
        setNotes("");
        onSuccess?.();
      } else {
        toast.error(res.error || "Failed to log call.");
      }
    } catch {
      toast.error("Failed to log call.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                <PhoneCall className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle>Log Call with {prospect.firstName}</DialogTitle>
                <DialogDescription>{prospect.phone ? prospect.phone : "No phone listed on file"}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3.5 py-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Call Outcome</Label>
                <Select value={outcome} onValueChange={setOutcome}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Connected - Positive">Connected - Positive</SelectItem>
                    <SelectItem value="Connected - Follow-Up Needed">Connected - Follow-Up</SelectItem>
                    <SelectItem value="Left Voicemail">Left Voicemail</SelectItem>
                    <SelectItem value="No Answer / Busy">No Answer / Busy</SelectItem>
                    <SelectItem value="Wrong Number">Wrong Number</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="call-duration" className="text-xs">
                  Duration (Minutes)
                </Label>
                <Input
                  id="call-duration"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min="1"
                  max="180"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="call-notes" className="text-xs">
                Call Notes & Key Discussion Points
              </Label>
              <Textarea
                id="call-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Discussed current asset allocation, timeline to evaluate advisors..."
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving Log..." : "Save Call Log"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
