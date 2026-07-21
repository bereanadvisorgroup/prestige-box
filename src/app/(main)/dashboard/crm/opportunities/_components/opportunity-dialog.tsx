"use client";

import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { DollarSign, FileText, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as z from "zod";

import { createOpportunity, updateOpportunity } from "@/actions/opportunities";
import { RichTextEditor } from "@/components/tasks/rich-text-editor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type Opportunity, OpportunitySchema } from "@/types/crm";

interface OpportunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity?: any | null; // Selected opportunity if editing
  pipelines: any[];
  clients: any[];
  companies: any[];
  defaultPipelineId?: string;
  defaultStageId?: string;
  defaultClientId?: string;
  defaultCompanyId?: string;
  onSaved?: () => void;
}

const todayInput = () => new Date().toISOString().slice(0, 10);

export function OpportunityDialog({
  open,
  onOpenChange,
  opportunity,
  pipelines,
  clients,
  companies,
  defaultPipelineId,
  defaultStageId,
  defaultClientId,
  defaultCompanyId,
  onSaved,
}: OpportunityDialogProps) {
  const isEditing = !!opportunity?.id;
  const [isSaving, setIsSaving] = React.useState(false);
  const [associationType, setAssociationType] = React.useState<"client" | "company">("client");

  const form = useForm({
    resolver: zodResolver(OpportunitySchema),
    defaultValues: {
      id: "",
      clientId: null,
      companyId: null,
      amount: "0.00",
      targetCloseDate: todayInput(),
      pipelineId: "",
      stageId: "",
      probabilityWin: 50,
      notes: "",
      resultStatus: null,
      resultNotes: "",
    },
  });

  // Watch pipelineId to dynamically show/update stages
  const selectedPipelineId = form.watch("pipelineId");

  const pipelineStages = React.useMemo(() => {
    const pipe = pipelines.find((p) => p.id === selectedPipelineId);
    return pipe?.stages || [];
  }, [selectedPipelineId, pipelines]);

  // Sync form defaults when editing or loading
  React.useEffect(() => {
    if (!open) return;

    if (opportunity) {
      form.reset({
        id: opportunity.id,
        clientId: opportunity.clientId || null,
        companyId: opportunity.companyId || null,
        amount: opportunity.amount ? String(opportunity.amount) : "0.00",
        targetCloseDate: opportunity.targetCloseDate ? opportunity.targetCloseDate.slice(0, 10) : todayInput(),
        pipelineId: opportunity.pipelineId || "",
        stageId: opportunity.stageId || "",
        probabilityWin: opportunity.probabilityWin ?? 0,
        notes: opportunity.notes ?? "",
        resultStatus: opportunity.resultStatus || null,
        resultNotes: opportunity.resultNotes ?? "",
      });

      if (opportunity.companyId) {
        setAssociationType("company");
      } else {
        setAssociationType("client");
      }
    } else {
      const activePipelines = pipelines.filter((p) => p.isActive);
      const pipeId = defaultPipelineId || activePipelines[0]?.id || "";
      const pipe = pipelines.find((p) => p.id === pipeId);
      const stgId = defaultStageId || pipe?.stages?.[0]?.id || "";

      form.reset({
        id: "",
        clientId: defaultClientId || null,
        companyId: defaultCompanyId || null,
        amount: "0.00",
        targetCloseDate: todayInput(),
        pipelineId: pipeId,
        stageId: stgId,
        probabilityWin: 50,
        notes: "",
        resultStatus: null,
        resultNotes: "",
      });

      if (defaultCompanyId) {
        setAssociationType("company");
      } else {
        setAssociationType("client");
      }
    }
  }, [open, opportunity, pipelines, defaultPipelineId, defaultStageId, defaultClientId, defaultCompanyId]);

  // Automatically update stageId if pipeline changes and current stageId is not in pipeline
  React.useEffect(() => {
    if (!open) return;
    if (pipelineStages.length > 0) {
      const currentStageId = form.getValues("stageId");
      const hasStage = pipelineStages.some((s: any) => s.id === currentStageId);
      if (!hasStage) {
        form.setValue("stageId", pipelineStages[0].id);
      }
    } else {
      form.setValue("stageId", "");
    }
  }, [selectedPipelineId, pipelineStages, open]);

  // Keep association fields exclusive based on selection
  React.useEffect(() => {
    if (associationType === "client") {
      form.setValue("companyId", null);
    } else {
      form.setValue("clientId", null);
    }
  }, [associationType]);

  async function onSubmit(values: any) {
    setIsSaving(true);
    try {
      const payload = {
        ...values,
        clientId: associationType === "client" ? values.clientId || null : null,
        companyId: associationType === "company" ? values.companyId || null : null,
      };

      if (!payload.clientId && !payload.companyId) {
        toast.error("Please select a Client or a Company");
        setIsSaving(false);
        return;
      }

      const result = isEditing ? await updateOpportunity(opportunity.id, payload) : await createOpportunity(payload);

      if (result.success) {
        toast.success(isEditing ? "Opportunity updated successfully" : "Opportunity created successfully");
        onOpenChange(false);
        onSaved?.();
      } else {
        toast.error(result.error || "Failed to save opportunity");
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  }

  const resultStatus = form.watch("resultStatus");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <FileText className="h-5 w-5 text-primary" />
            {isEditing ? "Edit Opportunity" : "New Opportunity"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update details, progress stages, or finalize this opportunity."
              : "Create a new opportunity and place it in a pipeline."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Association Section (Client vs Company) */}
            {!isEditing && (
              <div className="space-y-2">
                <FormLabel className="font-semibold">Associate With</FormLabel>
                <Tabs
                  value={associationType}
                  onValueChange={(val) => setAssociationType(val as "client" | "company")}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-2">
                    <TabsTrigger value="client">Client</TabsTrigger>
                    <TabsTrigger value="company">Company</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            )}

            {associationType === "client" ? (
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Client</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""} disabled={isSaving || isEditing}>
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select a Client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.person ? `${c.person.firstName} ${c.person.lastName}` : "Unnamed Client"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="companyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Company</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""} disabled={isSaving || isEditing}>
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select a Company" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companies.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Amount and PWin */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Opportunity Amount</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="0.00"
                          disabled={isSaving}
                          className="pl-9 bg-background"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="probabilityWin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Probability Win (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="50"
                        disabled={isSaving}
                        className="bg-background"
                        onChange={(e) => field.onChange(Number.parseInt(e.target.value) || 0)}
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Target Close Date and Pipeline Selection */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="targetCloseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Target Close Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        disabled={isSaving}
                        className="bg-background"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pipelineId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Opportunity Pipeline</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isSaving || isEditing}>
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select a Pipeline" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {pipelines
                          .filter((p) => p.isActive || p.id === field.value)
                          .map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Stage selection */}
            <FormField
              control={form.control}
              name="stageId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Current Stage</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isSaving}>
                    <FormControl>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select current stage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {pipelineStages.map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Opportunity Notes WYSIWYG */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Notes</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Add detailed opportunity notes..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Result Section (when editing) */}
            {isEditing && (
              <div className="border-t pt-4 space-y-4">
                <FormField
                  control={form.control}
                  name="resultStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Result Status</FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(val === "ACTIVE" ? null : val)}
                        value={field.value || "ACTIVE"}
                        disabled={isSaving}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Active" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Active (In Pipeline)</SelectItem>
                          <SelectItem value="WON">WON</SelectItem>
                          <SelectItem value="LOST">LOST</SelectItem>
                          <SelectItem value="TRASH">TRASH</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>Set status to WON, LOST, or TRASH to close this opportunity.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {resultStatus && (
                  <FormField
                    control={form.control}
                    name="resultNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold">Result Notes</FormLabel>
                        <FormControl>
                          <RichTextEditor
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder={`Explain why this opportunity was marked as ${resultStatus}...`}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}

            <DialogFooter className="border-t pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Save Opportunity" : "Create Opportunity"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
