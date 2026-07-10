"use client";

import { useRef, useState } from "react";

import { useRouter } from "next/navigation";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, GripVertical, Loader2, Paperclip, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { createWorkflowTemplate, updateWorkflowTemplate } from "@/actions/workflow-templates";
import { RichTextEditor } from "@/components/tasks/rich-text-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase.client";
import { cn } from "@/lib/utils";
import {
  DUE_DATE_BASE_LABELS,
  WORKFLOW_DUE_DATE_BASES,
  WORKFLOW_DUE_DAYS,
  WORKFLOW_PRIORITIES,
  type WorkflowAttachment,
  type WorkflowTemplate,
  WorkflowTemplateSchema,
  type WorkflowTemplateStep,
} from "@/types/workflows";

type BuilderStep = WorkflowTemplateStep & { localId: string };

const PRIORITY_BADGE_CLASSES: Record<string, string> = {
  None: "bg-muted text-muted-foreground",
  Low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  Medium: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  High: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

function newStep(): BuilderStep {
  return {
    localId: crypto.randomUUID(),
    name: "",
    sortOrder: 0,
    setDueDate: false,
    dueDays: 1,
    dueDateBase: "workflow_start",
    priority: "None",
    description: "",
    responsibility: "advisor",
    attachments: [],
  };
}

interface TemplateBuilderProps {
  template?: WorkflowTemplate;
}

export function TemplateBuilder({ template }: TemplateBuilderProps) {
  const router = useRouter();
  const [name, setName] = useState(template?.name ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [steps, setSteps] = useState<BuilderStep[]>(() =>
    template?.steps?.length
      ? template.steps.map((s) => ({ ...s, attachments: s.attachments ?? [], localId: s.id ?? crypto.randomUUID() }))
      : [newStep()],
  );
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSteps((current) => {
      const oldIndex = current.findIndex((s) => s.localId === active.id);
      const newIndex = current.findIndex((s) => s.localId === over.id);
      return arrayMove(current, oldIndex, newIndex);
    });
  };

  const updateStep = (localId: string, patch: Partial<BuilderStep>) => {
    setSteps((current) => current.map((s) => (s.localId === localId ? { ...s, ...patch } : s)));
  };

  const removeStep = (localId: string) => {
    setSteps((current) => current.filter((s) => s.localId !== localId));
  };

  const handleSave = async () => {
    const payload = {
      name,
      description,
      steps: steps.map(({ localId: _localId, ...step }, index) => ({ ...step, sortOrder: index })),
    };

    const parsed = WorkflowTemplateSchema.omit({ id: true }).safeParse(payload);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      toast.error(first?.message || "Please fix the highlighted fields");
      return;
    }

    setIsSaving(true);
    try {
      const result = template?.id
        ? await updateWorkflowTemplate(template.id, parsed.data)
        : await createWorkflowTemplate(parsed.data);

      if (result.success) {
        toast.success(template?.id ? "Workflow updated" : "Workflow created");
        router.push("/dashboard/admin/workflows");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to save workflow");
      }
    } catch (_error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <h1 className="font-bold text-3xl tracking-tight">{template?.id ? "Edit Workflow" : "New Workflow"}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/dashboard/admin/workflows")} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="font-semibold shadow-sm">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Template
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="workflow-name">Name</Label>
            <Input
              id="workflow-name"
              placeholder="e.g. New Client Onboarding"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <RichTextEditor
              value={description ?? ""}
              onChange={setDescription}
              placeholder="Describe what this workflow accomplishes…"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-xl">Steps</h2>
          <Button variant="outline" size="sm" onClick={() => setSteps((current) => [...current, newStep()])}>
            <Plus className="mr-2 h-4 w-4" />
            Add Step
          </Button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={steps.map((s) => s.localId)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {steps.map((step, index) => (
                <SortableStepCard
                  key={step.localId}
                  step={step}
                  index={index}
                  canRemove={steps.length > 1}
                  onChange={(patch) => updateStep(step.localId, patch)}
                  onRemove={() => removeStep(step.localId)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

interface SortableStepCardProps {
  step: BuilderStep;
  index: number;
  canRemove: boolean;
  onChange: (patch: Partial<BuilderStep>) => void;
  onRemove: () => void;
}

function SortableStepCard({ step, index, canRemove, onChange, onRemove }: SortableStepCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.localId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploaded: WorkflowAttachment[] = [];
      for (const file of Array.from(files)) {
        const fileExt = file.name.split(".").pop();
        const randomStr = Math.random().toString(36).substring(7);
        const filePath = `workflows/steps/${randomStr}_${Date.now()}.${fileExt}`;

        const { error } = await supabase.storage.from("documents").upload(filePath, file);
        if (error) throw error;

        const {
          data: { publicUrl },
        } = supabase.storage.from("documents").getPublicUrl(filePath);

        uploaded.push({
          id: crypto.randomUUID(),
          fileUrl: publicUrl,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        });
      }
      onChange({ attachments: [...(step.attachments ?? []), ...uploaded] });
      toast.success(`${uploaded.length} file(s) attached`);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to upload file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Card ref={setNodeRef} style={style} className={cn("border", isDragging && "z-10 opacity-80 shadow-lg")}>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 py-3">
        <button
          type="button"
          className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
          aria-label="Drag to reorder step"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary text-sm">
          {index + 1}
        </div>
        <Input
          placeholder="Step name"
          value={step.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="max-w-md font-medium"
        />
        <div className="ml-auto flex items-center gap-2">
          {step.priority !== "None" && (
            <Badge className={cn("border-0", PRIORITY_BADGE_CLASSES[step.priority])}>{step.priority}</Badge>
          )}
          <Badge variant="outline" className="capitalize">
            {step.responsibility === "advisor" ? "Advisor" : "Client"}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={() => setIsExpanded((v) => !v)}
            aria-label={isExpanded ? "Collapse step" : "Expand step"}
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive/80"
            onClick={onRemove}
            disabled={!canRemove}
            aria-label="Remove step"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4 border-t pt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`due-${step.localId}`}
                  checked={step.setDueDate}
                  onCheckedChange={(checked) => onChange({ setDueDate: checked === true })}
                />
                <Label htmlFor={`due-${step.localId}`}>Set due date</Label>
              </div>
              {step.setDueDate && (
                <div className="flex flex-wrap items-center gap-2 pl-6">
                  <Select
                    value={String(step.dueDays ?? 1)}
                    onValueChange={(value) => onChange({ dueDays: Number(value) })}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WORKFLOW_DUE_DAYS.map((d) => (
                        <SelectItem key={d} value={String(d)}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-muted-foreground text-sm">day(s) from</span>
                  <Select
                    value={step.dueDateBase ?? "workflow_start"}
                    onValueChange={(value) => onChange({ dueDateBase: value as BuilderStep["dueDateBase"] })}
                  >
                    <SelectTrigger className="w-56">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WORKFLOW_DUE_DATE_BASES.map((base) => (
                        <SelectItem key={base} value={base}>
                          {DUE_DATE_BASE_LABELS[base]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={step.priority}
                  onValueChange={(value) => onChange({ priority: value as BuilderStep["priority"] })}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WORKFLOW_PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Responsibility</Label>
              <RadioGroup
                value={step.responsibility}
                onValueChange={(value) => onChange({ responsibility: value as BuilderStep["responsibility"] })}
                className="flex gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="advisor" id={`resp-advisor-${step.localId}`} />
                  <Label htmlFor={`resp-advisor-${step.localId}`}>Advisor</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="client" id={`resp-client-${step.localId}`} />
                  <Label htmlFor={`resp-client-${step.localId}`}>Client / Company</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <RichTextEditor
              value={step.description ?? ""}
              onChange={(html) => onChange({ description: html })}
              placeholder="Describe what needs to happen in this step…"
            />
          </div>

          <div className="space-y-2">
            <Label>File Attachments</Label>
            <div className="flex flex-wrap items-center gap-2">
              {(step.attachments ?? []).map((attachment) => (
                <Badge key={attachment.id} variant="secondary" className="gap-1.5 py-1 pr-1 pl-2">
                  <Paperclip className="h-3 w-3" />
                  <a
                    href={attachment.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="max-w-48 truncate hover:underline"
                  >
                    {attachment.fileName}
                  </a>
                  <button
                    type="button"
                    className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                    onClick={() =>
                      onChange({ attachments: (step.attachments ?? []).filter((a) => a.id !== attachment.id) })
                    }
                    aria-label={`Remove ${attachment.fileName}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleUpload(e.target.files)}
              />
              <Button variant="outline" size="sm" disabled={isUploading} onClick={() => fileInputRef.current?.click()}>
                {isUploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Paperclip className="mr-2 h-4 w-4" />
                )}
                {isUploading ? "Uploading..." : "Attach Files"}
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
