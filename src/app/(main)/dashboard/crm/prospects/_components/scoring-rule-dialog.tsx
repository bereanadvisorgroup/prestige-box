"use client";

import * as React from "react";

import { toast } from "sonner";

import { createProspectScoringRule, updateProspectScoringRule } from "@/actions/prospect-scoring-rules";
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
import { Switch } from "@/components/ui/switch";
import type { ProspectScoringRule } from "@/types/prospects";

interface ScoringRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: ProspectScoringRule | null;
  onSuccess?: () => void;
}

export function ScoringRuleDialog({ open, onOpenChange, rule, onSuccess }: ScoringRuleDialogProps) {
  const isEdit = !!rule?.id;
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [formData, setFormData] = React.useState({
    name: "",
    conditionType: "job_title_matches" as ProspectScoringRule["conditionType"],
    conditionValue: "",
    points: 10,
    isActive: true,
  });

  React.useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name,
        conditionType: rule.conditionType,
        conditionValue: rule.conditionValue || "",
        points: rule.points,
        isActive: rule.isActive ?? true,
      });
    } else {
      setFormData({
        name: "",
        conditionType: "job_title_matches",
        conditionValue: "",
        points: 10,
        isActive: true,
      });
    }
  }, [rule]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Rule name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<ProspectScoringRule> = {
        name: formData.name.trim(),
        conditionType: formData.conditionType,
        conditionValue: formData.conditionValue.trim() || null,
        points: Number(formData.points) || 0,
        isActive: formData.isActive,
      };

      if (isEdit && rule?.id) {
        const res = await updateProspectScoringRule(rule.id, payload);
        if (res.success) {
          toast.success("Scoring rule updated.");
          onOpenChange(false);
          onSuccess?.();
        } else {
          toast.error(res.error || "Failed to update scoring rule.");
        }
      } else {
        const res = await createProspectScoringRule(payload);
        if (res.success) {
          toast.success("Scoring rule created.");
          onOpenChange(false);
          onSuccess?.();
        } else {
          toast.error(res.error || "Failed to create scoring rule.");
        }
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getConditionPlaceholder = () => {
    switch (formData.conditionType) {
      case "job_title_matches":
        return "e.g. CEO,CTO,President,Founder,Partner";
      case "field_is_not_empty":
        return "e.g. phone, company, or customFields.deal_size";
      case "stage_is":
        return "e.g. Demo Scheduled, Qualified";
      case "source_is":
        return "e.g. Website, Inbound, Referral";
      case "inactivity_days":
        return "e.g. 30 (days without update)";
      default:
        return "Condition value";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Scoring Rule" : "New Scoring Rule"}</DialogTitle>
            <DialogDescription>
              Define logic triggers to automatically adjust prospect lead temperature and quality points.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-3">
            <div className="space-y-1.5">
              <Label htmlFor="rule-name" className="text-xs">
                Rule Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="rule-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Executive Title Match, Phone Provided"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Trigger Condition Type</Label>
              <Select
                value={formData.conditionType}
                onValueChange={(val) =>
                  setFormData({
                    ...formData,
                    conditionType: val as ProspectScoringRule["conditionType"],
                  })
                }
              >
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="job_title_matches">Target Job Title (Matches keywords)</SelectItem>
                  <SelectItem value="field_is_not_empty">Field Is Not Empty (Contact data present)</SelectItem>
                  <SelectItem value="stage_is">Pipeline Stage (Advanced to stage)</SelectItem>
                  <SelectItem value="source_is">Lead Source (Origin attribution)</SelectItem>
                  <SelectItem value="inactivity_days">Inactivity Period (Days without change)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rule-val" className="text-xs">
                Condition Value (Comma-separated if multiple)
              </Label>
              <Input
                id="rule-val"
                value={formData.conditionValue}
                onChange={(e) => setFormData({ ...formData, conditionValue: e.target.value })}
                placeholder={getConditionPlaceholder()}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <Label htmlFor="rule-pts" className="text-xs">
                  Score Points (+ or -)
                </Label>
                <Input
                  id="rule-pts"
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })}
                />
              </div>

              <div className="flex flex-col justify-end space-y-1.5 pb-1">
                <div className="flex items-center justify-between rounded-md border p-2 text-xs">
                  <Label htmlFor="rule-active" className="cursor-pointer text-xs">
                    Rule Active
                  </Label>
                  <Switch
                    id="rule-active"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEdit ? "Save Rule" : "Create Rule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
