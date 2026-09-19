"use client";

import * as React from "react";

import { ExternalLink, Mail } from "lucide-react";
import { toast } from "sonner";

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
import { Textarea } from "@/components/ui/textarea";
import type { EnrichedProspect } from "@/types/prospects";

interface QuickEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prospect: EnrichedProspect | null;
  onSuccess?: () => void;
}

export function QuickEmailDialog({ open, onOpenChange, prospect, onSuccess }: QuickEmailDialogProps) {
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");

  React.useEffect(() => {
    if (prospect) {
      setSubject(`Introduction from Prestige Advisors - ${prospect.firstName} ${prospect.lastName}`);
      setBody(
        `Hi ${prospect.firstName},\n\nThank you for connecting with Prestige Advisors. I wanted to follow up regarding our wealth management services and schedule a brief introduction.\n\nBest regards,\nPrestige Advisors Team`,
      );
    }
  }, [prospect]);

  if (!prospect) return null;

  const handleOpenClient = () => {
    if (!prospect.email) {
      toast.error("No email address listed for this prospect.");
      return;
    }

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(prospect.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, "_blank", "noopener,noreferrer");
    toast.success("Opening Google Workspace mail client...");
    onOpenChange(false);
    onSuccess?.();
  };

  const handleOpenMailto = () => {
    if (!prospect.email) {
      toast.error("No email address listed for this prospect.");
      return;
    }

    const mailto = `mailto:${prospect.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    toast.success("Opening local email client...");
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle>
                Email {prospect.firstName} {prospect.lastName}
              </DialogTitle>
              <DialogDescription>{prospect.email || "No email on file"}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3.5 py-3">
          <div className="space-y-1.5">
            <Label htmlFor="email-subj" className="text-xs">
              Subject
            </Label>
            <Input id="email-subj" value={subject} onChange={(e) => setSubject(e.target.value)} className="text-xs" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email-body" className="text-xs">
              Message Body
            </Label>
            <Textarea
              id="email-body"
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="text-xs"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleOpenMailto}
            className="text-muted-foreground text-xs hover:text-foreground"
          >
            Use Local Mail App
          </Button>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleOpenClient} className="gap-1.5">
              <span>Open Default Mail Client</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
