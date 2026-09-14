"use client";

import * as React from "react";

import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { createProspectCustomField, updateProspectCustomField } from "@/actions/prospect-custom-fields";
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
import { CUSTOM_FIELD_TYPES, type CustomFieldType, type ProspectCustomField } from "@/types/prospects";

interface CustomFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customField?: ProspectCustomField | null;
  onSuccess?: () => void;
}

export function CustomFieldDialog({ open, onOpenChange, customField, onSuccess }: CustomFieldDialogProps) {
  const isEdit = !!customField?.id;
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [formData, setFormData] = React.useState({
    name: "",
    label: "",
    fieldType: "text" as CustomFieldType,
    options: [] as string[],
    isRequired: false,
    defaultValue: "",
  });

  const [newOption, setNewOption] = React.useState("");

  React.useEffect(() => {
    if (customField) {
      setFormData({
        name: customField.name,
        label: customField.label,
        fieldType: customField.fieldType as CustomFieldType,
        options: customField.options || [],
        isRequired: customField.isRequired || false,
        defaultValue: customField.defaultValue || "",
      });
    } else {
      setFormData({
        name: "",
        label: "",
        fieldType: "text",
        options: [],
        isRequired: false,
        defaultValue: "",
      });
    }
    setNewOption("");
  }, [customField]);

  const handleAddOption = () => {
    if (!newOption.trim()) return;
    if (formData.options.includes(newOption.trim())) {
      toast.error("Option already exists.");
      return;
    }
    setFormData({
      ...formData,
      options: [...formData.options, newOption.trim()],
    });
    setNewOption("");
  };

  const handleRemoveOption = (index: number) => {
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.label.trim()) {
      toast.error("Display label is required.");
      return;
    }

    const machineName = (formData.name || formData.label)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_]/g, "_");

    if (formData.fieldType === "dropdown" && formData.options.length === 0) {
      toast.error("Please add at least one dropdown option.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<ProspectCustomField> = {
        name: machineName,
        label: formData.label.trim(),
        fieldType: formData.fieldType,
        options: formData.options,
        isRequired: formData.isRequired,
        defaultValue: formData.defaultValue.trim() || null,
      };

      if (isEdit && customField?.id) {
        const res = await updateProspectCustomField(customField.id, payload);
        if (res.success) {
          toast.success("Custom field updated.");
          onOpenChange(false);
          onSuccess?.();
        } else {
          toast.error(res.error || "Failed to update custom field.");
        }
      } else {
        const res = await createProspectCustomField(payload);
        if (res.success) {
          toast.success("Custom field created.");
          onOpenChange(false);
          onSuccess?.();
        } else {
          toast.error(res.error || "Failed to create custom field.");
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
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Custom Field" : "Add Custom Field"}</DialogTitle>
            <DialogDescription>
              Define dynamic schema attributes to collect customized prospect information.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-3">
            <div className="space-y-1.5">
              <Label htmlFor="cf-label" className="text-xs">
                Display Label <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cf-label"
                value={formData.label}
                onChange={(e) => {
                  const label = e.target.value;
                  const autoKey = label
                    .toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9_]/g, "_");
                  setFormData({
                    ...formData,
                    label,
                    name: isEdit ? formData.name : autoKey,
                  });
                }}
                placeholder="e.g. Expected Deal Size, Decision Timeline"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cf-name" className="text-xs">
                Field Identifier Key
              </Label>
              <Input
                id="cf-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
                  })
                }
                disabled={isEdit}
                placeholder="e.g. expected_deal_size"
                className="font-mono text-xs"
              />
              <p className="text-[10px] text-muted-foreground">Internal JSON key used in database and CSV mapping.</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Field Type</Label>
              <Select
                value={formData.fieldType}
                onValueChange={(val) => setFormData({ ...formData, fieldType: val as CustomFieldType })}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CUSTOM_FIELD_TYPES.map((ft) => (
                    <SelectItem key={ft} value={ft}>
                      {ft.charAt(0).toUpperCase() + ft.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Options list for Dropdown */}
            {formData.fieldType === "dropdown" && (
              <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
                <Label className="font-semibold text-xs">Dropdown Options</Label>
                <div className="flex gap-2">
                  <Input
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Add option..."
                    className="h-8 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddOption();
                      }
                    }}
                  />
                  <Button type="button" size="sm" variant="outline" onClick={handleAddOption} className="h-8 text-xs">
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    <span>Add</span>
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {formData.options.map((opt, idx) => (
                    <div key={opt} className="flex items-center gap-1 rounded-md border bg-card px-2 py-0.5 text-xs">
                      <span>{opt}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="cf-default" className="text-xs">
                Default Value (Optional)
              </Label>
              <Input
                id="cf-default"
                value={formData.defaultValue}
                onChange={(e) => setFormData({ ...formData, defaultValue: e.target.value })}
                placeholder="Initial value for new prospects"
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEdit ? "Update Field" : "Add Field"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
