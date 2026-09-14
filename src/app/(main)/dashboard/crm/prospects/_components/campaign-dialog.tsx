"use client";

import * as React from "react";

import { toast } from "sonner";

import { createCampaign, updateCampaign } from "@/actions/campaigns";
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
import {
  CAMPAIGN_CHANNELS,
  CAMPAIGN_STATUSES,
  type Campaign,
  type CampaignChannel,
  type CampaignStatus,
  type EnrichedCampaign,
} from "@/types/prospects";

interface CampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: EnrichedCampaign | Campaign | null;
  onSuccess?: () => void;
}

export function CampaignDialog({ open, onOpenChange, campaign, onSuccess }: CampaignDialogProps) {
  const isEdit = !!campaign?.id;
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [formData, setFormData] = React.useState({
    name: "",
    channel: "Google Ads" as CampaignChannel,
    status: "Active" as CampaignStatus,
    budget: 0,
    startDate: "",
    endDate: "",
    targetAudience: "",
    description: "",
  });

  React.useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name || "",
        channel: (campaign.channel as CampaignChannel) || "Google Ads",
        status: (campaign.status as CampaignStatus) || "Active",
        budget: campaign.budget || 0,
        startDate: campaign.startDate ? campaign.startDate.slice(0, 10) : "",
        endDate: campaign.endDate ? campaign.endDate.slice(0, 10) : "",
        targetAudience: campaign.targetAudience || "",
        description: campaign.description || "",
      });
    } else {
      setFormData({
        name: "",
        channel: "Google Ads",
        status: "Active",
        budget: 0,
        startDate: new Date().toISOString().slice(0, 10),
        endDate: "",
        targetAudience: "",
        description: "",
      });
    }
  }, [campaign]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Campaign name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<Campaign> = {
        name: formData.name.trim(),
        channel: formData.channel,
        status: formData.status,
        budget: Number(formData.budget) || 0,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        targetAudience: formData.targetAudience.trim() || null,
        description: formData.description.trim() || null,
      };

      if (isEdit && campaign?.id) {
        const res = await updateCampaign(campaign.id, payload);
        if (res.success) {
          toast.success("Campaign updated successfully.");
          onOpenChange(false);
          onSuccess?.();
        } else {
          toast.error(res.error || "Failed to update campaign.");
        }
      } else {
        const res = await createCampaign(payload);
        if (res.success) {
          toast.success("Campaign created successfully.");
          onOpenChange(false);
          onSuccess?.();
        } else {
          toast.error(res.error || "Failed to create campaign.");
        }
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Campaign" : "New Campaign"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update campaign parameters, budget, and audience definition."
                : "Create a marketing or outreach campaign to track prospect acquisition and attribution."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="camp-name" className="text-xs">
                Campaign Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="camp-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Q2 Private Wealth Forum"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Channel</Label>
                <Select
                  value={formData.channel}
                  onValueChange={(val) => setFormData({ ...formData, channel: val as CampaignChannel })}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Select channel" />
                  </SelectTrigger>
                  <SelectContent>
                    {CAMPAIGN_CHANNELS.map((ch) => (
                      <SelectItem key={ch} value={ch}>
                        {ch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData({ ...formData, status: val as CampaignStatus })}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {CAMPAIGN_STATUSES.map((st) => (
                      <SelectItem key={st} value={st}>
                        {st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="camp-budget" className="text-xs">
                  Budget ($)
                </Label>
                <Input
                  id="camp-budget"
                  type="number"
                  min="0"
                  step="100"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="camp-start" className="text-xs">
                  Start Date
                </Label>
                <Input
                  id="camp-start"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="camp-end" className="text-xs">
                  End Date
                </Label>
                <Input
                  id="camp-end"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="camp-audience" className="text-xs">
                Target Audience
              </Label>
              <Input
                id="camp-audience"
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                placeholder="e.g. Founders, Physicians, Family Offices"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="camp-desc" className="text-xs">
                Description / Notes
              </Label>
              <Textarea
                id="camp-desc"
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Goals, creative angles, key target geographies..."
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Campaign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
