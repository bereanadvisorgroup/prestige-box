"use client";

import * as React from "react";

import { Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteProspectCustomField } from "@/actions/prospect-custom-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ProspectCustomField } from "@/types/prospects";

import { CustomFieldDialog } from "./custom-field-dialog";

interface CustomFieldsSectionProps {
  customFields: ProspectCustomField[];
  onRefresh?: () => void;
}

export function CustomFieldsSection({ customFields, onRefresh }: CustomFieldsSectionProps) {
  const [selectedField, setSelectedField] = React.useState<ProspectCustomField | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const handleDelete = async (field: ProspectCustomField) => {
    const confirm = window.confirm(
      `Are you sure you want to delete custom field "${field.label}"? Existing saved values in prospects will be preserved in JSON records.`,
    );
    if (!confirm) return;

    try {
      const res = await deleteProspectCustomField(field.id!);
      if (res.success) {
        toast.success("Custom field deleted.");
        onRefresh?.();
      } else {
        toast.error(res.error || "Failed to delete custom field.");
      }
    } catch {
      toast.error("An error occurred while deleting custom field.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground text-lg tracking-tight">Podio-Style Dynamic Custom Fields</h3>
            <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary text-xs">
              <Sparkles className="h-3 w-3" />
              <span>Extensible Schema</span>
            </Badge>
          </div>
          <p className="mt-0.5 text-muted-foreground text-xs">
            Configure custom data attributes for your prospects. Custom fields dynamically render across prospect
            profiles, edit dialogs, table grids, and the CSV import engine.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => {
            setSelectedField(null);
            setIsDialogOpen(true);
          }}
          className="gap-1.5 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Custom Field</span>
        </Button>
      </div>

      <div className="rounded-md border bg-card shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 text-xs">
              <TableHead>Field Label</TableHead>
              <TableHead>Machine Identifier</TableHead>
              <TableHead>Field Type</TableHead>
              <TableHead>Configured Options / Default</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customFields.length ? (
              customFields.map((cf) => (
                <TableRow key={cf.id} className="transition-colors hover:bg-muted/40">
                  <TableCell className="font-semibold text-foreground text-sm">{cf.label}</TableCell>
                  <TableCell className="font-mono text-muted-foreground text-xs">customFields.{cf.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs capitalize">
                      {cf.fieldType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {cf.fieldType === "dropdown" && cf.options?.length > 0 ? (
                      <div className="flex max-w-md flex-wrap gap-1">
                        {cf.options.map((opt) => (
                          <Badge key={opt} variant="secondary" className="px-1.5 py-0 text-[10px]">
                            {opt}
                          </Badge>
                        ))}
                      </div>
                    ) : cf.defaultValue ? (
                      <span className="text-muted-foreground text-xs">Default: {cf.defaultValue}</span>
                    ) : (
                      <span className="text-muted-foreground/40 text-xs italic">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setSelectedField(cf);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(cf)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground text-xs">
                  No custom fields defined yet. Click "Add Custom Field" to create your first field.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <CustomFieldDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        customField={selectedField}
        onSuccess={onRefresh}
      />
    </div>
  );
}
