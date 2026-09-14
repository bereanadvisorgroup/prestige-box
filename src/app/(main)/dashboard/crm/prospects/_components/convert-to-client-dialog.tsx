"use client";

import * as React from "react";

import Link from "next/link";

import { ArrowUpRight, CheckCircle2, UserCheck } from "lucide-react";
import { toast } from "sonner";

import { convertProspectToClient } from "@/actions/prospects";
import { Badge } from "@/components/ui/badge";
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
import type { EnrichedProspect } from "@/types/prospects";

interface ConvertToClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prospect: EnrichedProspect | null;
  advisors?: { uid: string; name: string }[];
  onSuccess?: () => void;
}

export function ConvertToClientDialog({
  open,
  onOpenChange,
  prospect,
  advisors = [],
  onSuccess,
}: ConvertToClientDialogProps) {
  const [selectedAdvisorId, setSelectedAdvisorId] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [conversionResult, setConversionResult] = React.useState<{
    clientId: string;
    personId: string;
  } | null>(null);

  React.useEffect(() => {
    if (prospect) {
      setSelectedAdvisorId(prospect.assignedRepId || "");
      setConversionResult(null);
    }
  }, [prospect]);

  if (!prospect) return null;

  const fullName = `${prospect.firstName} ${prospect.lastName}`.trim();

  const handleConvert = async () => {
    setIsSubmitting(true);
    try {
      const res = await convertProspectToClient(prospect.id!, selectedAdvisorId || null);

      if (res.success && res.clientId && res.personId) {
        setConversionResult({
          clientId: res.clientId,
          personId: res.personId,
        });
        toast.success(`Successfully converted ${fullName} into an active client!`);
        onSuccess?.();
      } else {
        toast.error(res.error || "Failed to convert prospect.");
      }
    } catch {
      toast.error("An error occurred during client conversion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Convert Prospect to Client</DialogTitle>
              <DialogDescription>
                Promote <span className="font-semibold text-foreground">{fullName}</span> from the prospect pipeline
                into PrestigeBox CRM client profiles.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {conversionResult ? (
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                <div className="space-y-1">
                  <h4 className="font-semibold text-emerald-900 text-sm dark:text-emerald-300">
                    Conversion Successful!
                  </h4>
                  <p className="text-emerald-700 text-xs dark:text-emerald-400">
                    A dedicated Person and Client profile have been generated, bidirectional references established, and
                    stage advanced to Closed Won.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button asChild className="w-full gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                <Link href={`/dashboard/crm/clients/${conversionResult.clientId}`}>
                  <span>Go to Client Profile</span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full gap-1.5">
                <Link href={`/dashboard/crm/people/${conversionResult.personId}`}>
                  <span>View Person Record</span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-3">
            {/* Summary Mapping Overview */}
            <div className="space-y-2 rounded-lg border bg-muted/30 p-3 text-xs">
              <div className="flex items-center justify-between font-medium text-foreground">
                <span>Data being copied:</span>
                <Badge variant="secondary" className="font-mono text-[10px]">
                  Automatic Sync
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t pt-1 text-muted-foreground">
                <div>
                  <span className="font-medium text-foreground">Name: </span>
                  {fullName}
                </div>
                <div>
                  <span className="font-medium text-foreground">Email: </span>
                  {prospect.email || "None"}
                </div>
                <div>
                  <span className="font-medium text-foreground">Phone: </span>
                  {prospect.phone || "None"}
                </div>
                <div>
                  <span className="font-medium text-foreground">Company: </span>
                  {prospect.company || "None"}
                </div>
              </div>
            </div>

            {/* Advisor Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs">Assigned Primary Advisor</Label>
              <Select
                value={selectedAdvisorId || "none"}
                onValueChange={(val) => setSelectedAdvisorId(val === "none" ? "" : val)}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select advisor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None / Unassigned</SelectItem>
                  {advisors.map((a) => (
                    <SelectItem key={a.uid} value={a.uid}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                This advisor will be assigned as the primary wealth advisor on the newly created client record.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {conversionResult ? (
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConvert}
                disabled={isSubmitting}
                className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {isSubmitting ? "Converting..." : "Confirm & Convert"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
