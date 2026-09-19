"use client";

import * as React from "react";

import { ChevronDown, ChevronUp, MapPin, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { createProspect, updateProspect } from "@/actions/prospects";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { normalizeStateToAbbreviation, US_STATES } from "@/lib/us-states";
import {
  type Campaign,
  type EnrichedProspect,
  PROSPECT_SOURCES,
  PROSPECT_STAGES,
  type Prospect,
  type ProspectCustomField,
  type ProspectStage,
} from "@/types/prospects";

interface ProspectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prospect?: EnrichedProspect | null;
  customFields?: ProspectCustomField[];
  campaigns?: Campaign[];
  advisors?: { uid: string; name: string }[];
  defaultStage?: ProspectStage;
  onSuccess?: () => void;
}

export function ProspectDialog({
  open,
  onOpenChange,
  prospect,
  customFields = [],
  campaigns = [],
  advisors = [],
  defaultStage = "New",
  onSuccess,
}: ProspectDialogProps) {
  const isEdit = !!prospect?.id;
  const [showUtm, setShowUtm] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form state
  const [formData, setFormData] = React.useState({
    prefix: "",
    firstName: "",
    middleName: "",
    lastName: "",
    suffix: "",
    goesBy: "",
    email: "",
    phone: "",
    company: "",
    jobTitle: "",
    stage: defaultStage,
    source: "Website",
    assignedRepId: "",
    primaryCampaignId: "",
    notes: "",
    street: "",
    street2: "",
    city: "",
    state: "",
    zip: "",
    utmSource: "",
    utmMedium: "",
    utmCampaign: "",
    utmTerm: "",
    utmContent: "",
    customFields: {} as Record<string, unknown>,
  });

  React.useEffect(() => {
    if (prospect) {
      setFormData({
        prefix: prospect.prefix || "",
        firstName: prospect.firstName || "",
        middleName: prospect.middleName || "",
        lastName: prospect.lastName || "",
        suffix: prospect.suffix || "",
        goesBy: prospect.goesBy || "",
        email: prospect.email || "",
        phone: prospect.phone || "",
        company: prospect.company || "",
        jobTitle: prospect.jobTitle || "",
        stage: prospect.stage || "New",
        source: prospect.source || "Website",
        assignedRepId: prospect.assignedRepId || "",
        primaryCampaignId: prospect.primaryCampaignId || "",
        notes: prospect.notes || "",
        street: prospect.street || "",
        street2: prospect.street2 || "",
        city: prospect.city || "",
        state: normalizeStateToAbbreviation(prospect.state) || prospect.state || "",
        zip: prospect.zip || "",
        utmSource: prospect.utmSource || "",
        utmMedium: prospect.utmMedium || "",
        utmCampaign: prospect.utmCampaign || "",
        utmTerm: prospect.utmTerm || "",
        utmContent: prospect.utmContent || "",
        customFields: { ...(prospect.customFields || {}) },
      });
    } else {
      // Default custom fields initialization
      const defaultCustoms: Record<string, unknown> = {};
      for (const cf of customFields) {
        if (cf.defaultValue) {
          defaultCustoms[cf.name] = cf.defaultValue;
        }
      }

      setFormData({
        prefix: "",
        firstName: "",
        middleName: "",
        lastName: "",
        suffix: "",
        goesBy: "",
        email: "",
        phone: "",
        company: "",
        jobTitle: "",
        stage: defaultStage,
        source: "Website",
        assignedRepId: "",
        primaryCampaignId: "",
        notes: "",
        street: "",
        street2: "",
        city: "",
        state: "",
        zip: "",
        utmSource: "",
        utmMedium: "",
        utmCampaign: "",
        utmTerm: "",
        utmContent: "",
        customFields: defaultCustoms,
      });
    }
  }, [prospect, defaultStage, customFields]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error("First name and Last name are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const normalizedState = formData.state
        ? normalizeStateToAbbreviation(formData.state) || formData.state.trim() || null
        : null;

      const payload: Partial<Prospect> = {
        prefix: formData.prefix.trim() || null,
        firstName: formData.firstName.trim(),
        middleName: formData.middleName.trim() || null,
        lastName: formData.lastName.trim(),
        suffix: formData.suffix.trim() || null,
        goesBy: formData.goesBy.trim() || null,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        company: formData.company.trim() || null,
        jobTitle: formData.jobTitle.trim() || null,
        stage: formData.stage,
        source: formData.source,
        assignedRepId: formData.assignedRepId || null,
        primaryCampaignId: formData.primaryCampaignId || null,
        notes: formData.notes?.trim() && formData.notes !== "<p></p>" ? formData.notes : null,
        street: formData.street.trim() || null,
        street2: formData.street2.trim() || null,
        city: formData.city.trim() || null,
        state: normalizedState,
        zip: formData.zip.trim() || null,
        utmSource: formData.utmSource.trim() || null,
        utmMedium: formData.utmMedium.trim() || null,
        utmCampaign: formData.utmCampaign.trim() || null,
        utmTerm: formData.utmTerm.trim() || null,
        utmContent: formData.utmContent.trim() || null,
        customFields: formData.customFields,
      };

      if (isEdit && prospect?.id) {
        const res = await updateProspect(prospect.id, payload);
        if (res.success) {
          toast.success("Prospect updated successfully.");
          onOpenChange(false);
          onSuccess?.();
        } else {
          toast.error(res.error || "Failed to update prospect.");
        }
      } else {
        const res = await createProspect(payload);
        if (res.success) {
          toast.success("Prospect created successfully.");
          onOpenChange(false);
          onSuccess?.();
        } else {
          toast.error(res.error || "Failed to create prospect.");
        }
      }
    } catch (_err) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateCustomField = (name: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      customFields: {
        ...prev.customFields,
        [name]: value,
      },
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Prospect" : "New Prospect"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update prospect profile, campaign ties, and custom fields."
                : "Add a prospective client into the pipeline for tracking and attribution."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name Fields */}
            <div className="grid grid-cols-8 gap-2.5">
              <div className="col-span-2 space-y-1.5 sm:col-span-1">
                <Label htmlFor="prefix" className="text-xs">
                  Prefix
                </Label>
                <Input
                  id="prefix"
                  value={formData.prefix}
                  onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                  placeholder="Mr."
                />
              </div>
              <div className="col-span-4 space-y-1.5 sm:col-span-2">
                <Label htmlFor="firstName" className="text-xs">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="e.g. Eleanor"
                  required
                />
              </div>
              <div className="col-span-3 space-y-1.5 sm:col-span-1">
                <Label htmlFor="middleName" className="text-xs">
                  Middle
                </Label>
                <Input
                  id="middleName"
                  value={formData.middleName}
                  onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                  placeholder="M."
                />
              </div>
              <div className="col-span-3 space-y-1.5 sm:col-span-2">
                <Label htmlFor="lastName" className="text-xs">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="e.g. Vance"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="suffix" className="text-xs">
                  Suffix
                </Label>
                <Input
                  id="suffix"
                  value={formData.suffix}
                  onChange={(e) => setFormData({ ...formData, suffix: e.target.value })}
                  placeholder="e.g. Jr., III, PhD"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="goesBy" className="text-xs">
                  Goes By
                </Label>
                <Input
                  id="goesBy"
                  value={formData.goesBy}
                  onChange={(e) => setFormData({ ...formData, goesBy: e.target.value })}
                  placeholder="e.g. Ellie"
                />
              </div>
            </div>

            {/* Contact Fields */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="eleanor@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 234-5678"
                />
              </div>
            </div>

            {/* Company & Job Title */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="company" className="text-xs">
                  Company / Organization
                </Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="e.g. Apex Holdings LLC"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="jobTitle" className="text-xs">
                  Job Title / Role
                </Label>
                <Input
                  id="jobTitle"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  placeholder="e.g. Chief Executive Officer"
                />
              </div>
            </div>

            {/* Address Fields */}
            <div className="space-y-2 rounded-lg border bg-muted/15 p-3">
              <div className="flex items-center gap-1.5 font-semibold text-foreground text-xs">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span>Address</span>
              </div>
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="street" className="text-[11px] text-muted-foreground">
                    Street Address
                  </Label>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    placeholder="e.g. 123 Financial Way"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="street2" className="text-[11px] text-muted-foreground">
                    Street Address 2 (Apt, Suite, Unit)
                  </Label>
                  <Input
                    id="street2"
                    value={formData.street2}
                    onChange={(e) => setFormData({ ...formData, street2: e.target.value })}
                    placeholder="e.g. Suite 400"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-6">
                  <div className="space-y-1 sm:col-span-3">
                    <Label htmlFor="city" className="text-[11px] text-muted-foreground">
                      City
                    </Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. Charlotte"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-1">
                    <Label htmlFor="state" className="text-[11px] text-muted-foreground">
                      State
                    </Label>
                    <Select
                      value={formData.state || "none"}
                      onValueChange={(val) => setFormData({ ...formData, state: val === "none" ? "" : val })}
                    >
                      <SelectTrigger id="state" className="h-8 w-full text-xs">
                        <SelectValue placeholder="State">{formData.state ? formData.state : undefined}</SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        <SelectItem value="none">--</SelectItem>
                        {US_STATES.map((st) => (
                          <SelectItem key={st.code} value={st.code}>
                            <span className="font-semibold">{st.code}</span>
                            <span className="ml-1.5 font-normal text-muted-foreground text-xs">({st.name})</span>
                          </SelectItem>
                        ))}
                        {formData.state && !US_STATES.some((st) => st.code === formData.state) && (
                          <SelectItem value={formData.state}>{formData.state}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="zip" className="text-[11px] text-muted-foreground">
                      ZIP
                    </Label>
                    <Input
                      id="zip"
                      value={formData.zip}
                      onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                      placeholder="28202"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Stage & Source */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Pipeline Stage</Label>
                <Select
                  value={formData.stage}
                  onValueChange={(val) => setFormData({ ...formData, stage: val as ProspectStage })}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROSPECT_STAGES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Lead Source</Label>
                <Select value={formData.source} onValueChange={(val) => setFormData({ ...formData, source: val })}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROSPECT_SOURCES.map((src) => (
                      <SelectItem key={src} value={src}>
                        {src}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Rep & Campaign Assignment */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Assigned Advisor / Rep</Label>
                <Select
                  value={formData.assignedRepId || "none"}
                  onValueChange={(val) => setFormData({ ...formData, assignedRepId: val === "none" ? "" : val })}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {advisors.map((adv) => (
                      <SelectItem key={adv.uid} value={adv.uid}>
                        {adv.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Primary Acquisition Campaign</Label>
                <Select
                  value={formData.primaryCampaignId || "none"}
                  onValueChange={(val) => setFormData({ ...formData, primaryCampaignId: val === "none" ? "" : val })}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="None / Direct" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None / Direct</SelectItem>
                    {campaigns.map((camp) => (
                      <SelectItem key={camp.id} value={camp.id!}>
                        {camp.name} ({camp.channel})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes WYSIWYG Field */}
            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <RichTextEditor
                value={formData.notes}
                onChange={(html) => setFormData((prev) => ({ ...prev, notes: html }))}
                placeholder="Add prospect notes..."
              />
            </div>

            {/* Dynamic Custom Fields */}
            {customFields.length > 0 && (
              <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
                <div className="flex items-center gap-1.5 font-semibold text-foreground text-xs">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span>Custom Fields</span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {customFields.map((cf) => {
                    const val = formData.customFields[cf.name];

                    if (cf.fieldType === "dropdown") {
                      return (
                        <div key={cf.id} className="space-y-1.5">
                          <Label className="text-xs">{cf.label}</Label>
                          <Select
                            value={String(val ?? cf.defaultValue ?? "")}
                            onValueChange={(v) => updateCustomField(cf.name, v)}
                          >
                            <SelectTrigger className="text-xs">
                              <SelectValue placeholder={`Select ${cf.label}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {cf.options.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                  {opt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    }

                    if (cf.fieldType === "boolean") {
                      return (
                        <div key={cf.id} className="flex items-center justify-between rounded-md border p-2 text-xs">
                          <Label htmlFor={cf.name} className="cursor-pointer text-xs">
                            {cf.label}
                          </Label>
                          <Switch
                            id={cf.name}
                            checked={!!val}
                            onCheckedChange={(checked) => updateCustomField(cf.name, checked)}
                          />
                        </div>
                      );
                    }

                    return (
                      <div key={cf.id} className="space-y-1.5">
                        <Label htmlFor={cf.name} className="text-xs">
                          {cf.label}
                        </Label>
                        <Input
                          id={cf.name}
                          type={cf.fieldType === "number" ? "number" : cf.fieldType === "date" ? "date" : "text"}
                          value={val !== undefined && val !== null ? String(val) : ""}
                          onChange={(e) =>
                            updateCustomField(
                              cf.name,
                              cf.fieldType === "number" ? Number(e.target.value) : e.target.value,
                            )
                          }
                          placeholder={`Enter ${cf.label}`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* UTM Parameters Collapsible Section */}
            <div className="rounded-lg border bg-muted/10">
              <button
                type="button"
                className="flex w-full items-center justify-between p-3 font-medium text-muted-foreground text-xs hover:text-foreground"
                onClick={() => setShowUtm(!showUtm)}
              >
                <span>Digital Attribution / UTM Parameters (Optional)</span>
                {showUtm ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {showUtm && (
                <div className="grid grid-cols-1 gap-2.5 border-t p-3 pt-0 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-[11px]">UTM Source</Label>
                    <Input
                      value={formData.utmSource}
                      onChange={(e) => setFormData({ ...formData, utmSource: e.target.value })}
                      placeholder="google, linkedin"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">UTM Medium</Label>
                    <Input
                      value={formData.utmMedium}
                      onChange={(e) => setFormData({ ...formData, utmMedium: e.target.value })}
                      placeholder="cpc, organic, email"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">UTM Campaign</Label>
                    <Input
                      value={formData.utmCampaign}
                      onChange={(e) => setFormData({ ...formData, utmCampaign: e.target.value })}
                      placeholder="wealth-summit-2026"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">UTM Term</Label>
                    <Input
                      value={formData.utmTerm}
                      onChange={(e) => setFormData({ ...formData, utmTerm: e.target.value })}
                      placeholder="wealth management"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-[11px]">UTM Content</Label>
                    <Input
                      value={formData.utmContent}
                      onChange={(e) => setFormData({ ...formData, utmContent: e.target.value })}
                      placeholder="hero_cta_button"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Prospect"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
