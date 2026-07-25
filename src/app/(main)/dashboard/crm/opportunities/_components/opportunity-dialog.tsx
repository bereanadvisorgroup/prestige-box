"use client";

import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { format, formatDistanceStrict } from "date-fns";
import { DollarSign, FileText, Folder, HardDrive, Loader2, Percent, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createOpportunity, getOpportunityHistory, updateOpportunity } from "@/actions/opportunities";
import { getDefaultAumPerc } from "@/actions/opportunity-pipelines";
import { GoogleDrivePickerDialog } from "@/components/tasks/gdrive-picker-dialog";
import { RichTextEditor } from "@/components/tasks/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OpportunitySchema } from "@/types/crm";

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

interface DriveAttachment {
  id: string;
  name: string;
  url: string;
  isFolder: boolean;
}

function parseDriveAttachmentsFromNotes(rawNotes: string | null | undefined): {
  cleanNotes: string;
  attachments: DriveAttachment[];
} {
  if (!rawNotes?.trim()) {
    return { cleanNotes: "", attachments: [] };
  }

  const sectionIdx = rawNotes.indexOf('<div class="gdrive-attachments-section');
  if (sectionIdx !== -1) {
    const cleanNotes = rawNotes.slice(0, sectionIdx).trim();
    const sectionHtml = rawNotes.slice(sectionIdx);

    const attachments: DriveAttachment[] = [];
    const linkRegex = /<a href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
    let match = linkRegex.exec(sectionHtml);
    while (match !== null) {
      const url = match[1];
      const rawText = match[2].trim();
      const isFolder = rawText.includes("📁") || url.includes("/folders/");
      const name = rawText
        .replace(/^[📁📄]\s*/u, "")
        .replace(/\s*\(Google Drive\)$/, "")
        .trim();
      attachments.push({
        id: crypto.randomUUID(),
        name: name || "Google Drive Item",
        url,
        isFolder,
      });
      match = linkRegex.exec(sectionHtml);
    }
    return { cleanNotes, attachments };
  }

  return { cleanNotes: rawNotes, attachments: [] };
}

function buildNotesPayload(cleanNotes: string, attachments: DriveAttachment[]): string {
  const baseNotes = cleanNotes ? cleanNotes.trim() : "";
  if (!attachments || attachments.length === 0) {
    return baseNotes;
  }

  const listItemsHtml = attachments
    .map(
      (a) =>
        `<li data-gdrive-id="${a.id}" data-gdrive-folder="${a.isFolder}"><a href="${a.url}" target="_blank" rel="noreferrer" class="gdrive-link">${
          a.isFolder ? "📁" : "📄"
        } ${a.name} (Google Drive)</a></li>`,
    )
    .join("");

  const sectionHtml = `<div class="gdrive-attachments-section mt-4 pt-3 border-t"><p class="font-semibold text-sm mb-2">Linked Google Drive Files:</p><ul>${listItemsHtml}</ul></div>`;

  return baseNotes ? `${baseNotes}<br/>${sectionHtml}` : sectionHtml;
}

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
  const [activeTab, setActiveTab] = React.useState("details");
  const [history, setHistory] = React.useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(false);
  const [defaultAumPerc, setDefaultAumPerc] = React.useState<number>(1);

  // Google Drive Picker and attachments state
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [driveAttachments, setDriveAttachments] = React.useState<DriveAttachment[]>([]);

  React.useEffect(() => {
    getDefaultAumPerc().then((res) => {
      if (res.success && res.value !== undefined) {
        setDefaultAumPerc(res.value);
      }
    });
  }, []);

  const form = useForm({
    resolver: zodResolver(OpportunitySchema),
    defaultValues: {
      id: "",
      clientId: null,
      companyId: null,
      amount: "0.00",
      flatFee: "0.00",
      aumAmount: "0.00",
      aumPercentage: "0.00",
      lifeInsurance: "0.00",
      targetCloseDate: todayInput(),
      pipelineId: "",
      stageId: "",
      probabilityWin: 50,
      notes: "",
      resultStatus: null,
      resultNotes: "",
      closeDate: null,
      changeReason: "",
    },
  });

  const watchedClientId = form.watch("clientId");
  const watchedCompanyId = form.watch("companyId");

  const selectedEntityInfo = React.useMemo(() => {
    if (associationType === "client" && watchedClientId) {
      const client = clients.find((c) => c.id === watchedClientId);
      if (client) {
        const name = client.person
          ? `${client.person.firstName ?? ""} ${client.person.lastName ?? ""}`.trim()
          : "Client";
        return {
          name,
          documentUrl: (client.documentUrl as string | null | undefined) ?? null,
        };
      }
    }
    if (associationType === "company" && watchedCompanyId) {
      const company = companies.find((c) => c.id === watchedCompanyId);
      if (company) {
        return {
          name: company.name || "Company",
          documentUrl: (company.documentUrl as string | null | undefined) ?? null,
        };
      }
    }
    return null;
  }, [associationType, watchedClientId, watchedCompanyId, clients, companies]);

  const hasDocumentUrl = !!(selectedEntityInfo?.documentUrl && selectedEntityInfo.documentUrl.trim() !== "");

  const handleDriveSelect = (item: { name: string; url: string; isFolder: boolean }) => {
    const newAttachment: DriveAttachment = {
      id: crypto.randomUUID(),
      name: item.name,
      url: item.url,
      isFolder: item.isFolder,
    };
    setDriveAttachments((prev) => [...prev, newAttachment]);
    toast.success(`Linked Google Drive ${item.isFolder ? "folder" : "file"}`);
  };

  const removeDriveAttachment = (id: string) => {
    setDriveAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Watch pipelineId to dynamically show/update stages
  const selectedPipelineId = form.watch("pipelineId");

  const selectedPipeline = React.useMemo(() => {
    return pipelines.find((p) => p.id === selectedPipelineId);
  }, [selectedPipelineId, pipelines]);

  const watchedFlatFee = form.watch("flatFee");
  const watchedAumAmount = form.watch("aumAmount");
  const watchedAumPercentage = form.watch("aumPercentage");
  const watchedLifeInsurance = form.watch("lifeInsurance");

  React.useEffect(() => {
    const flatFeeVal = selectedPipeline?.hasFlatFee
      ? Number.parseFloat(String(watchedFlatFee || "0").replace(/,/g, "")) || 0
      : 0;
    const aumAmountVal = selectedPipeline?.hasAum
      ? Number.parseFloat(String(watchedAumAmount || "0").replace(/,/g, "")) || 0
      : 0;
    const aumPercentageVal = selectedPipeline?.hasAum ? Number.parseFloat(String(watchedAumPercentage || "0")) || 0 : 0;
    const lifeInsuranceVal = selectedPipeline?.hasLifeInsurance
      ? Number.parseFloat(String(watchedLifeInsurance || "0").replace(/,/g, "")) || 0
      : 0;

    const total = flatFeeVal + aumAmountVal * (aumPercentageVal / 100) + lifeInsuranceVal;
    form.setValue("amount", total.toFixed(2));
  }, [watchedFlatFee, watchedAumAmount, watchedAumPercentage, watchedLifeInsurance, selectedPipeline, form.setValue]);

  const amountStr = form.watch("amount");
  const probabilityWin = form.watch("probabilityWin");

  const weightedAmount = React.useMemo(() => {
    const amountVal = Number.parseFloat(String(amountStr || "0").replace(/,/g, "")) || 0;
    return amountVal * ((probabilityWin || 0) / 100);
  }, [amountStr, probabilityWin]);

  const pipelineStages = React.useMemo(() => {
    return selectedPipeline?.stages || [];
  }, [selectedPipeline]);

  const prevResultStatusRef = React.useRef<string | null | undefined>(null);

  // Sync form defaults when editing or loading
  React.useEffect(() => {
    if (!open) return;

    // Reset active tab to details when opening
    setActiveTab("details");

    if (opportunity) {
      const initialStatus = opportunity.resultStatus || null;
      prevResultStatusRef.current = initialStatus;

      const { cleanNotes, attachments: extracted } = parseDriveAttachmentsFromNotes(opportunity.notes);
      setDriveAttachments(extracted);

      form.reset({
        id: opportunity.id,
        clientId: opportunity.clientId || null,
        companyId: opportunity.companyId || null,
        amount: opportunity.amount ? String(opportunity.amount) : "0.00",
        flatFee: opportunity.flatFee ? String(opportunity.flatFee) : "0.00",
        aumAmount: opportunity.aumAmount ? String(opportunity.aumAmount) : "0.00",
        aumPercentage: opportunity.aumPercentage ? String(opportunity.aumPercentage) : String(defaultAumPerc),
        lifeInsurance: opportunity.lifeInsurance ? String(opportunity.lifeInsurance) : "0.00",
        targetCloseDate: opportunity.targetCloseDate ? opportunity.targetCloseDate.slice(0, 10) : todayInput(),
        pipelineId: opportunity.pipelineId || "",
        stageId: opportunity.stageId || "",
        probabilityWin: opportunity.probabilityWin ?? 0,
        notes: cleanNotes,
        resultStatus: initialStatus,
        resultNotes: opportunity.resultNotes ?? "",
        closeDate: opportunity.closeDate ? opportunity.closeDate.slice(0, 10) : null,
        changeReason: "",
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

      prevResultStatusRef.current = null;
      setDriveAttachments([]);

      form.reset({
        id: "",
        clientId: defaultClientId || null,
        companyId: defaultCompanyId || null,
        amount: "0.00",
        flatFee: "0.00",
        aumAmount: "0.00",
        aumPercentage: String(defaultAumPerc),
        lifeInsurance: "0.00",
        targetCloseDate: todayInput(),
        pipelineId: pipeId,
        stageId: stgId,
        probabilityWin: 50,
        notes: "",
        resultStatus: null,
        resultNotes: "",
        closeDate: null,
        changeReason: "",
      });

      if (defaultCompanyId) {
        setAssociationType("company");
      } else {
        setAssociationType("client");
      }
    }
  }, [
    open,
    opportunity,
    pipelines,
    defaultPipelineId,
    defaultStageId,
    defaultClientId,
    defaultCompanyId,
    form.reset,
    defaultAumPerc,
  ]);

  // Load history when dialog is open in edit mode
  React.useEffect(() => {
    if (open && isEditing && opportunity?.id) {
      setIsLoadingHistory(true);
      getOpportunityHistory(opportunity.id)
        .then((res) => {
          if (res.success && res.history) {
            setHistory(res.history);
          }
        })
        .catch(console.error)
        .finally(() => {
          setIsLoadingHistory(false);
        });
    }
  }, [open, isEditing, opportunity?.id]);

  // Generate display history with virtual creation event prepended if missing
  const displayHistory = React.useMemo(() => {
    const sorted = [...history].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const hasCreated = sorted.some((h) => h.type === "created");
    if (hasCreated || !opportunity) return sorted;

    const creatorName = opportunity.updatedBy
      ? `${opportunity.updatedBy.firstName || ""} ${opportunity.updatedBy.lastName || ""}`.trim()
      : "Unknown User";

    const virtualCreated = {
      id: "virtual-created",
      opportunityId: opportunity.id,
      type: "created",
      actorName: creatorName,
      createdAt: opportunity.createdAt || new Date().toISOString(),
    };

    return [virtualCreated, ...sorted];
  }, [history, opportunity]);

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
  }, [pipelineStages, open, form.getValues, form.setValue]);

  // Keep association fields exclusive based on selection
  React.useEffect(() => {
    if (associationType === "client") {
      form.setValue("companyId", null);
    } else {
      form.setValue("clientId", null);
    }
  }, [associationType, form.setValue]);

  // Watch resultStatus to automatically set/clear closeDate in the form
  const resultStatus = form.watch("resultStatus");
  React.useEffect(() => {
    if (!open) return;
    const currentStatus = form.getValues("resultStatus");
    if (currentStatus !== prevResultStatusRef.current) {
      if (currentStatus) {
        // If closed, populate closeDate if not already set
        if (!form.getValues("closeDate")) {
          form.setValue("closeDate", todayInput());
        }
      } else {
        // If active, clear closeDate
        form.setValue("closeDate", null);
      }
      prevResultStatusRef.current = currentStatus;
    }
  }, [
    open, // If active, clear closeDate
    form.setValue,
    form.getValues,
  ]);

  const targetCloseDateVal = form.watch("targetCloseDate");
  const isDateChanged = React.useMemo(() => {
    if (!isEditing || !opportunity) return false;
    const original = opportunity.targetCloseDate ? opportunity.targetCloseDate.slice(0, 10) : "";
    const current = targetCloseDateVal || "";
    return original !== current;
  }, [isEditing, opportunity, targetCloseDateVal]);

  const createdAtVal = opportunity?.createdAt;
  const closeDateVal = form.watch("closeDate");

  const timeOpened = React.useMemo(() => {
    if (!isEditing || !createdAtVal) return null;
    const start = new Date(createdAtVal);
    const end = resultStatus && closeDateVal ? new Date(closeDateVal) : new Date();
    try {
      return formatDistanceStrict(start, end);
    } catch (_e) {
      return "0 days";
    }
  }, [isEditing, createdAtVal, resultStatus, closeDateVal]);

  async function onSubmit(values: any) {
    if (isDateChanged && !values.changeReason?.trim()) {
      form.setError("changeReason", {
        type: "manual",
        message: "Please enter a reason for changing the target close date",
      });
      return;
    }

    setIsSaving(true);
    try {
      const userNotes = values.notes || "";
      const finalNotes = buildNotesPayload(userNotes, driveAttachments);

      const payload = {
        ...values,
        notes: finalNotes,
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold text-xl">
              <FileText className="h-5 w-5 text-primary" />
              {isEditing ? "Edit Opportunity" : "New Opportunity"}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {isEditing ? (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <TabsList className="mb-6 grid grid-cols-2">
                      <TabsTrigger value="details">Opportunity Details</TabsTrigger>
                      <TabsTrigger value="history">History Log</TabsTrigger>
                    </TabsList>
                    {/* Metadata Box for Created Date and Time Opened */}
                    <div className="space-y-3 rounded-xl border bg-muted/40 p-4 text-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="block font-medium text-muted-foreground">Created Date</span>
                          <span className="font-semibold text-foreground">
                            {createdAtVal ? format(new Date(createdAtVal), "PPP") : "Today"}
                          </span>
                        </div>
                        <div>
                          <span className="block font-medium text-muted-foreground">Time Opened</span>
                          <span className="font-semibold text-foreground">{timeOpened || "0 days"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <TabsContent value="details" className="mt-0 space-y-5 focus-visible:outline-none">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      {associationType === "client" ? (
                        <FormField
                          control={form.control}
                          name="clientId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-semibold">Client</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value || ""}
                                disabled={isSaving || isEditing}
                              >
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
                              <Select
                                onValueChange={field.onChange}
                                value={field.value || ""}
                                disabled={isSaving || isEditing}
                              >
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
                    </div>
                    {/* Target Close Date Change Reason (only shown if date changed in edit mode) */}
                    {isDateChanged && (
                      <FormField
                        control={form.control}
                        name="changeReason"
                        render={({ field }) => (
                          <FormItem className="rounded-lg border border-amber-200 bg-amber-50/30 p-3">
                            <FormLabel className="flex items-center gap-1 font-semibold text-amber-900 text-sm">
                              Reason for Target Close Date Change{" "}
                              <span className="font-normal text-amber-600 text-xs">(Required)</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Client requested a delay, extended negotiation..."
                                disabled={isSaving}
                                className="mt-1.5 border-amber-300 bg-background focus-visible:ring-amber-500"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Financial Value Stream Fields */}
                    {(selectedPipeline?.hasFlatFee ||
                      selectedPipeline?.hasAum ||
                      selectedPipeline?.hasLifeInsurance) && (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                        {selectedPipeline?.hasFlatFee && (
                          <FormField
                            control={form.control}
                            name="flatFee"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-semibold">Flat Fee</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <DollarSign className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                      type="text"
                                      placeholder="0.00"
                                      disabled={isSaving}
                                      className="bg-background pl-9"
                                      {...field}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {selectedPipeline?.hasAum && (
                          <FormField
                            control={form.control}
                            name="aumAmount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-semibold">AUM Amount</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <DollarSign className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                      type="text"
                                      placeholder="0.00"
                                      disabled={isSaving}
                                      className="bg-background pl-9"
                                      {...field}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {selectedPipeline?.hasAum && (
                          <FormField
                            control={form.control}
                            name="aumPercentage"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-semibold">AUM Percentage</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input
                                      type="text"
                                      placeholder="0.00"
                                      disabled={isSaving}
                                      className="bg-background pr-9"
                                      {...field}
                                    />
                                    <Percent className="absolute top-2.5 right-3 h-4 w-4 text-muted-foreground" />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {selectedPipeline?.hasLifeInsurance && (
                          <FormField
                            control={form.control}
                            name="lifeInsurance"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-semibold">Life Insurance</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <DollarSign className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                      type="text"
                                      placeholder="0.00"
                                      disabled={isSaving}
                                      className="bg-background pl-9"
                                      {...field}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    )}

                    {/* Amount and PWin */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold">Total Opportunity</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <DollarSign className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="text"
                                  placeholder="0.00"
                                  readOnly
                                  disabled={isSaving}
                                  className="cursor-not-allowed bg-muted pl-9"
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
                            <div className="flex items-center justify-between">
                              <FormLabel className="font-semibold">Probability Win</FormLabel>
                              <span className="font-medium text-muted-foreground text-sm">{field.value}%</span>
                            </div>
                            <FormControl>
                              <Slider
                                min={0}
                                max={100}
                                step={1}
                                value={[field.value ?? 0]}
                                onValueChange={(vals) => field.onChange(vals[0])}
                                disabled={isSaving}
                                className="py-3"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormItem>
                        <FormLabel className="font-semibold text-muted-foreground/95">Expected Win Amount</FormLabel>
                        <div className="relative">
                          <DollarSign className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground/60" />
                          <div className="flex h-9 w-full select-none items-center rounded-md border border-input bg-muted/40 py-1 pr-3 pl-9 font-medium text-muted-foreground text-sm shadow-sm">
                            {new Intl.NumberFormat("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(weightedAmount)}
                          </div>
                        </div>
                      </FormItem>
                    </div>

                    {/* Stage selection */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                            <FormDescription>
                              Set status to WON, LOST, or TRASH to close this opportunity.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {resultStatus && (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="closeDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-semibold">Close Date</FormLabel>
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
                        </div>
                      )}

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

                    {/* Opportunity Notes WYSIWYG */}
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="font-semibold">Notes</FormLabel>
                            {hasDocumentUrl && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setPickerOpen(true)}
                                className="h-7 gap-1.5 border-emerald-300 text-emerald-700 text-xs hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                              >
                                <HardDrive className="h-3.5 w-3.5 text-emerald-600" />
                                Link File
                              </Button>
                            )}
                          </div>
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

                    {/* Linked Google Drive Files List */}
                    {driveAttachments.length > 0 && (
                      <div className="mt-3 space-y-2 rounded-lg border bg-muted/30 p-3">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 font-semibold text-foreground text-sm">
                            <HardDrive className="h-4 w-4 text-emerald-600" />
                            Linked Google Drive Files ({driveAttachments.length})
                          </span>
                        </div>
                        <div className="space-y-2 pt-1">
                          {driveAttachments.map((a) => (
                            <div
                              key={a.id}
                              className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm shadow-sm"
                            >
                              {a.isFolder ? (
                                <Folder className="h-4 w-4 shrink-0 text-amber-500" />
                              ) : (
                                <HardDrive className="h-4 w-4 shrink-0 text-emerald-600" />
                              )}
                              <a
                                href={a.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 truncate font-medium hover:underline"
                              >
                                {a.name}
                              </a>
                              <span className="shrink-0 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                Google Drive
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => removeDriveAttachment(a.id)}
                                title="Remove link"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="history" className="mt-0 space-y-4 focus-visible:outline-none">
                    {isLoadingHistory ? (
                      <div className="flex h-40 items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : displayHistory.length === 0 ? (
                      <div className="flex h-40 flex-col items-center justify-center text-muted-foreground">
                        <p>No history records found.</p>
                      </div>
                    ) : (
                      <div className="relative ml-3 space-y-6 border-muted border-l py-2 pl-6">
                        {displayHistory.map((item) => {
                          const dateStr = item.createdAt ? format(new Date(item.createdAt), "PPp") : "";
                          return (
                            <div key={item.id} className="relative">
                              {/* Timeline Dot */}
                              <span className="absolute top-1 -left-[31px] flex h-4 w-4 items-center justify-center rounded-full border bg-background text-primary shadow-sm">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                              </span>

                              <div className="space-y-1.5">
                                <div className="font-semibold text-foreground text-sm leading-tight">
                                  {item.type === "created" ? (
                                    <span>
                                      Opportunity Created on{" "}
                                      <span className="rounded bg-primary px-1.5 py-0.5 font-mono text-primary-foreground text-xs">
                                        {item.createdAt ? format(new Date(item.createdAt), "MM/dd/yyyy") : ""}
                                      </span>{" "}
                                      by <span className="font-bold text-foreground">{item.actorName}</span>
                                    </span>
                                  ) : (
                                    <span>
                                      Target Close Date changed by{" "}
                                      <span className="font-bold text-foreground">{item.actorName}</span>
                                    </span>
                                  )}
                                </div>

                                {item.type === "target_close_date_change" && (
                                  <div className="space-y-1.5 rounded-lg border bg-muted/40 p-2.5 text-muted-foreground text-xs">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="font-medium text-muted-foreground">Change:</span>
                                      <span className="rounded bg-rose-50 px-1 font-mono text-rose-600 line-through dark:bg-rose-950/20">
                                        {item.oldValue
                                          ? format(new Date(`${item.oldValue}T00:00:00`), "MM/dd/yyyy")
                                          : "None"}
                                      </span>
                                      <span>→</span>
                                      <span className="rounded bg-emerald-50 px-1 font-mono font-semibold text-emerald-600 dark:bg-emerald-950/20">
                                        {item.newValue
                                          ? format(new Date(`${item.newValue}T00:00:00`), "MM/dd/yyyy")
                                          : "None"}
                                      </span>
                                    </div>
                                    {item.reason && (
                                      <div>
                                        <span className="font-medium text-muted-foreground">Reason:</span>{" "}
                                        <span className="font-sans text-foreground italic">"{item.reason}"</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                <div className="flex items-center font-medium text-[10px] text-muted-foreground">
                                  {dateStr}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              ) : (
                // Create Mode: render details fields directly
                <>
                  {/* Association Section (Client vs Company) */}
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

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {associationType === "client" ? (
                      <FormField
                        control={form.control}
                        name="clientId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold">Client</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || ""}
                              disabled={isSaving || isEditing}
                            >
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
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || ""}
                              disabled={isSaving || isEditing}
                            >
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
                  </div>
                  {/* Financial Value Stream Fields */}
                  {(selectedPipeline?.hasFlatFee || selectedPipeline?.hasAum || selectedPipeline?.hasLifeInsurance) && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                      {selectedPipeline?.hasFlatFee && (
                        <FormField
                          control={form.control}
                          name="flatFee"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-semibold">Flat Fee</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <DollarSign className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    type="text"
                                    placeholder="0.00"
                                    disabled={isSaving}
                                    className="bg-background pl-9"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {selectedPipeline?.hasAum && (
                        <FormField
                          control={form.control}
                          name="aumAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-semibold">AUM Amount</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <DollarSign className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    type="text"
                                    placeholder="0.00"
                                    disabled={isSaving}
                                    className="bg-background pl-9"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {selectedPipeline?.hasAum && (
                        <FormField
                          control={form.control}
                          name="aumPercentage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-semibold">AUM Percentage</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type="text"
                                    placeholder="0.00"
                                    disabled={isSaving}
                                    className="bg-background pr-9"
                                    {...field}
                                  />
                                  <Percent className="absolute top-2.5 right-3 h-4 w-4 text-muted-foreground" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {selectedPipeline?.hasLifeInsurance && (
                        <FormField
                          control={form.control}
                          name="lifeInsurance"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-semibold">Life Insurance</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <DollarSign className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    type="text"
                                    placeholder="0.00"
                                    disabled={isSaving}
                                    className="bg-background pl-9"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  )}

                  {/* Amount and PWin */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold">Total Opportunity</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="text"
                                placeholder="0.00"
                                readOnly
                                disabled={isSaving}
                                className="cursor-not-allowed bg-muted pl-9"
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
                          <div className="flex items-center justify-between">
                            <FormLabel className="font-semibold">Probability Win</FormLabel>
                            <span className="font-medium text-muted-foreground text-sm">{field.value}%</span>
                          </div>
                          <FormControl>
                            <Slider
                              min={0}
                              max={100}
                              step={1}
                              value={[field.value ?? 0]}
                              onValueChange={(vals) => field.onChange(vals[0])}
                              disabled={isSaving}
                              className="py-3"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormItem>
                      <FormLabel className="font-semibold text-muted-foreground/95">Expected Win Amount</FormLabel>
                      <div className="relative">
                        <DollarSign className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground/60" />
                        <div className="flex h-9 w-full select-none items-center rounded-md border border-input bg-muted/40 py-1 pr-3 pl-9 font-medium text-muted-foreground text-sm shadow-sm">
                          {new Intl.NumberFormat("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(weightedAmount)}
                        </div>
                      </div>
                    </FormItem>
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
                        <div className="flex items-center justify-between">
                          <FormLabel className="font-semibold">Notes</FormLabel>
                          {hasDocumentUrl && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setPickerOpen(true)}
                              className="h-7 gap-1.5 border-emerald-300 text-emerald-700 text-xs hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                            >
                              <HardDrive className="h-3.5 w-3.5 text-emerald-600" />
                              Link File
                            </Button>
                          )}
                        </div>
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

                  {/* Linked Google Drive Files List */}
                  {driveAttachments.length > 0 && (
                    <div className="mt-3 space-y-2 rounded-lg border bg-muted/30 p-3">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-semibold text-foreground text-sm">
                          <HardDrive className="h-4 w-4 text-emerald-600" />
                          Linked Google Drive Files ({driveAttachments.length})
                        </span>
                      </div>
                      <div className="space-y-2 pt-1">
                        {driveAttachments.map((a) => (
                          <div
                            key={a.id}
                            className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm shadow-sm"
                          >
                            {a.isFolder ? (
                              <Folder className="h-4 w-4 shrink-0 text-amber-500" />
                            ) : (
                              <HardDrive className="h-4 w-4 shrink-0 text-emerald-600" />
                            )}
                            <a
                              href={a.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 truncate font-medium hover:underline"
                            >
                              {a.name}
                            </a>
                            <span className="shrink-0 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              Google Drive
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => removeDriveAttachment(a.id)}
                              title="Remove link"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              <DialogFooter className="border-t pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                  Cancel
                </Button>
                {(!isEditing || activeTab === "details") && (
                  <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditing ? "Save Opportunity" : "Create Opportunity"}
                  </Button>
                )}
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {selectedEntityInfo?.documentUrl && (
        <GoogleDrivePickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          entityName={selectedEntityInfo.name}
          documentUrl={selectedEntityInfo.documentUrl}
          onSelect={handleDriveSelect}
        />
      )}
    </>
  );
}
