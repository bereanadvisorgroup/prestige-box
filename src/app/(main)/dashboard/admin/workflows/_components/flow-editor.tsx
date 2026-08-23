"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  addEdge,
  Background,
  type Connection,
  Controls,
  type Edge,
  type EdgeChange,
  Handle,
  MarkerType,
  MiniMap,
  type Node,
  type NodeChange,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import {
  ChevronDown,
  GripVertical,
  Loader2,
  Maximize2,
  Minimize2,
  Paperclip,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { RichTextEditor } from "@/components/features/tasks/rich-text-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/lib/supabase.client";
import { cn } from "@/lib/utils";
import {
  DUE_DATE_BASE_LABELS,
  formatResponsibilityLabel,
  WORKFLOW_DUE_DATE_BASES,
  type WorkflowDueDateBase,
  WORKFLOW_DUE_DAYS,
  WORKFLOW_PRIORITIES,
  type WorkflowPriority,
  type WorkflowAttachment,
  type WorkflowOutcome,
  type WorkflowTemplateStep,
} from "@/types/workflows";

const PRIORITY_BADGE_CLASSES: Record<string, string> = {
  None: "bg-muted text-muted-foreground",
  Low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  Medium: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  High: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

// ---------------------------------------------------------------------------
// Start Node
// ---------------------------------------------------------------------------
function StartNode() {
  return (
    <Card className="w-36 border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-sm text-center">
      <CardContent className="p-2.5">
        <span className="font-semibold text-xs text-emerald-700 dark:text-emerald-300">Start Workflow</span>
      </CardContent>
      <Handle type="source" position={Position.Right} id="start" className="w-2.5 h-2.5 bg-emerald-500" />
    </Card>
  );
}

// ---------------------------------------------------------------------------
// End Node
// ---------------------------------------------------------------------------
function EndNode() {
  return (
    <Card className="w-36 border-slate-500/50 bg-slate-50/50 dark:bg-slate-900/30 shadow-sm text-center">
      <Handle type="target" position={Position.Left} id="end" className="w-2.5 h-2.5 bg-slate-500" />
      <CardContent className="p-2.5">
        <span className="font-semibold text-xs text-slate-700 dark:text-slate-300">End Workflow</span>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Step Node (Custom React Flow Node)
// ---------------------------------------------------------------------------
interface StepNodeData {
  label?: string;
  step: WorkflowTemplateStep;
  teams?: Array<{ id: string; name: string }>;
  availableTemplates?: Array<{ id: string; name: string }>;
  onEdit: () => void;
}

interface StepNodeProps {
  data: StepNodeData;
  selected?: boolean;
}

function StepNode({ data, selected }: StepNodeProps) {
  const step = data.step;
  const outcomes = step.outcomes || [];
  const availableTemplates: Array<{ id: string; name: string }> = data.availableTemplates || [];

  return (
    <Card
      className={cn(
        "w-64 border shadow-sm transition-all",
        selected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-muted-foreground/30",
      )}
    >
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 py-2.5 px-3 border-b bg-muted/20">
        <div className="cursor-grab text-muted-foreground">
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="truncate font-semibold text-xs text-foreground max-w-[150px]">
          {step.name || "Unnamed Step"}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            data.onEdit();
          }}
          className="ml-auto rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </CardHeader>
      <CardContent className="py-2.5 px-3 space-y-2 text-[11px] text-muted-foreground">
        <div className="flex justify-between items-center">
          <span>Priority:</span>
          <Badge
            className={cn(
              "px-1.5 py-0 text-[10px] font-medium border-0",
              PRIORITY_BADGE_CLASSES[step.priority || "None"],
            )}
          >
            {step.priority || "None"}
          </Badge>
        </div>
        <div className="flex justify-between items-center">
          <span>Assignee:</span>
          <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
            {formatResponsibilityLabel(step.responsibility, data?.teams)}
          </Badge>
        </div>
      </CardContent>

      {/* Target input handle */}
      <Handle type="target" position={Position.Left} id="input" className="w-2.5 h-2.5 bg-primary/70" />

      {/* Source outcome handles */}
      {outcomes.length === 0 ? (
        <Handle type="source" position={Position.Right} id="default" className="w-2.5 h-2.5 bg-primary/70" />
      ) : (
        outcomes.map((outcome: WorkflowOutcome, idx: number) => {
          const percent = outcomes.length === 1 ? 50 : 20 + (idx / (outcomes.length - 1)) * 60;
          const triggeredTemplate = availableTemplates.find((t) => t.id === outcome.triggerWorkflowTemplateId);

          return (
            <div key={outcome.id}>
              <span
                style={{ top: `${percent}%` }}
                className="absolute right-2.5 -translate-y-1/2 pr-1.5 text-[9px] font-bold text-muted-foreground bg-popover px-1.5 py-0.5 border rounded shadow-sm pointer-events-none z-10 opacity-90 flex items-center gap-1 max-w-[140px]"
              >
                <span className="truncate">{outcome.name}</span>
                {triggeredTemplate && (
                  <span
                    className="text-[8px] text-amber-600 dark:text-amber-400 font-semibold truncate flex items-center gap-0.5 shrink-0"
                    title={`Triggers: ${triggeredTemplate.name}`}
                  >
                    ⚡ {triggeredTemplate.name}
                  </span>
                )}
              </span>
              <Handle
                type="source"
                position={Position.Right}
                id={outcome.id}
                style={{ top: `${percent}%` }}
                className="w-2.5 h-2.5 bg-primary border-primary"
              />
            </div>
          );
        })
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Flow Editor Component
// ---------------------------------------------------------------------------
interface FlowEditorProps {
  initialGraph: { nodes: Node[]; edges: Edge[] };
  steps: WorkflowTemplateStep[];
  teams?: Array<{ id: string; name: string }>;
  availableTemplates?: Array<{ id: string; name: string }>;
  onChange: (graph: { nodes: Node[]; edges: Edge[] }, updatedSteps: WorkflowTemplateStep[]) => void;
}

export function FlowEditor({ initialGraph, steps, teams = [], availableTemplates = [], onChange }: FlowEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialGraph.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialGraph.edges || []);
  const [editingStep, setEditingStep] = useState<WorkflowTemplateStep | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newOutcomeName, setNewOutcomeName] = useState("");
  const [newTriggerWorkflowTemplateId, setNewTriggerWorkflowTemplateId] = useState<string>("none");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Maintain actual step values in a map for easy updates
  const [stepMap, setStepMap] = useState<Map<string, WorkflowTemplateStep>>(() => {
    const map = new Map<string, WorkflowTemplateStep>();
    for (const step of steps) {
      if (step.id) map.set(step.id, step);
    }
    return map;
  });

  const nodeTypes = useMemo(
    () => ({
      start: StartNode,
      end: EndNode,
      step: StepNode,
    }),
    [],
  );

  // Sync changes to parent outside the render phase
  useEffect(() => {
    // Compile outcomes nextStepId mapping from current edges
    const updatedSteps = Array.from(stepMap.values()).map((step) => {
      const stepEdges = edges.filter((e) => e.source === step.id);

      const outcomes = (step.outcomes || []).map((outcome) => {
        const edge = stepEdges.find((e) => e.sourceHandle === outcome.id);
        return {
          ...outcome,
          nextStepId: edge ? (edge.target === "end" ? null : edge.target) : null,
        };
      });

      // If no outcomes are configured but there's a linear edge, we can map that too
      if (outcomes.length === 0) {
        const defaultEdge = stepEdges.find((e) => e.sourceHandle === "default" || !e.sourceHandle);
        if (defaultEdge) {
          return {
            ...step,
            outcomes: [
              {
                id: "default",
                name: "Next",
                nextStepId: defaultEdge.target === "end" ? null : defaultEdge.target,
              },
            ],
          };
        }
      }

      return {
        ...step,
        outcomes,
      };
    });

    // Update node details inside the graph payload
    const graphNodes = nodes.map((n) => {
      if (n.type === "step") {
        const step = updatedSteps.find((s) => s.id === n.id);
        return {
          ...n,
          data: {
            ...n.data,
            label: step?.name || n.data.label,
            step,
            teams,
            availableTemplates,
          },
        };
      }
      return n;
    });

    onChange({ nodes: graphNodes, edges }, updatedSteps);
  }, [nodes, edges, stepMap, onChange, teams, availableTemplates]);

  // Hook nodes and edges change
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      // Grab the latest nodes after changes are applied
      setNodes((nds) => {
        // Sync positions of step nodes to stepMap
        const updatedMap = new Map(stepMap);
        let mapChanged = false;
        for (const n of nds) {
          if (n.type === "step") {
            const step = updatedMap.get(n.id);
            if (step && (step.positionX !== n.position.x || step.positionY !== n.position.y)) {
              updatedMap.set(n.id, {
                ...step,
                positionX: n.position.x,
                positionY: n.position.y,
              });
              mapChanged = true;
            }
          }
        }
        if (mapChanged) {
          setStepMap(updatedMap);
        }
        return nds;
      });
    },
    [onNodesChange, setNodes, stepMap],
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
    },
    [onEdgesChange],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const edge: Edge = {
        ...connection,
        id: `e-${connection.source}-${connection.target}-${connection.sourceHandle || "default"}`,
        markerEnd: { type: MarkerType.ArrowClosed },
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges],
  );

  const onEdgeDoubleClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
      toast.success("Connection removed");
    },
    [setEdges],
  );

  // Function to edit a step node
  const startEditStep = useCallback(
    (stepId: string) => {
      const step = stepMap.get(stepId);
      if (step) {
        setEditingStep(step);
      }
    },
    [stepMap],
  );

  // Inject helper handlers into the node data on load/change
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.type === "step") {
          const step = stepMap.get(node.id);
          return {
            ...node,
            data: {
              ...node.data,
              step: step || node.data.step,
              teams,
              availableTemplates,
              onEdit: () => startEditStep(node.id),
            },
          };
        }
        return node;
      }),
    );
  }, [stepMap, startEditStep, setNodes, teams, availableTemplates]);

  // Add a new step to the canvas
  const handleAddStep = () => {
    const newId = crypto.randomUUID();
    const step: WorkflowTemplateStep = {
      id: newId,
      name: "New Step",
      sortOrder: stepMap.size,
      setDueDate: true,
      dueDays: 1,
      dueDateBase: "after_last_step",
      priority: "None",
      description: "",
      responsibility: "client_company",
      attachments: [],
      outcomes: [],
      positionX: 400,
      positionY: 200,
    };

    setStepMap((prev) => {
      const next = new Map(prev);
      next.set(newId, step);
      return next;
    });

    const newNode = {
      id: newId,
      type: "step",
      position: { x: 400, y: 200 },
      data: {
        label: step.name,
        step,
        teams,
        availableTemplates,
        onEdit: () => startEditStep(newId),
      },
    };

    setNodes((nds) => [...nds, newNode]);
    toast.success("New step added to flow");
  };

  // Delete a step from the canvas
  const handleDeleteStep = (stepId: string) => {
    setStepMap((prev) => {
      const next = new Map(prev);
      next.delete(stepId);
      return next;
    });

    setNodes((nds) => nds.filter((n) => n.id !== stepId));
    setEdges((eds) => eds.filter((e) => e.source !== stepId && e.target !== stepId));

    setEditingStep(null);
    toast.success("Step removed from flow");
  };

  // Update step values from modal
  const updateEditingStep = (patch: Partial<WorkflowTemplateStep>) => {
    if (!editingStep?.id) return;
    const updated = { ...editingStep, ...patch };
    setEditingStep(updated);
    setStepMap((prev) => {
      const next = new Map(prev);
      next.set(editingStep.id!, updated);
      return next;
    });
  };

  // Upload attachments
  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !editingStep) return;

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
      updateEditingStep({ attachments: [...(editingStep.attachments ?? []), ...uploaded] });
      toast.success(`${uploaded.length} file(s) attached`);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to upload file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Add outcome to step
  const handleAddOutcome = () => {
    if (!newOutcomeName.trim() || !editingStep) return;

    const nextOutcome: WorkflowOutcome = {
      id: crypto.randomUUID(),
      name: newOutcomeName.trim(),
      nextStepId: null,
      triggerWorkflowTemplateId: newTriggerWorkflowTemplateId !== "none" ? newTriggerWorkflowTemplateId : null,
    };

    updateEditingStep({
      outcomes: [...(editingStep.outcomes || []), nextOutcome],
    });
    setNewOutcomeName("");
    setNewTriggerWorkflowTemplateId("none");
  };

  // Update trigger workflow for an existing outcome
  const handleUpdateOutcomeTrigger = (outcomeId: string, templateId: string) => {
    if (!editingStep) return;
    const outcomes = (editingStep.outcomes || []).map((o) =>
      o.id === outcomeId ? { ...o, triggerWorkflowTemplateId: templateId === "none" ? null : templateId } : o,
    );
    updateEditingStep({ outcomes });
  };

  // Remove outcome from step
  const handleRemoveOutcome = (outcomeId: string) => {
    if (!editingStep) return;

    // Filter outcomes
    const outcomes = (editingStep.outcomes || []).filter((o) => o.id !== outcomeId);
    updateEditingStep({ outcomes });

    // Delete any edge connected to this handle
    setEdges((eds) => {
      return eds.filter((e) => !(e.source === editingStep.id && e.sourceHandle === outcomeId));
    });
  };

  return (
    <>
      {isMaximized && (
        <button
          type="button"
          aria-label="Close maximized flow view"
          className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm transition-opacity duration-300 border-none cursor-default"
          onClick={() => setIsMaximized(false)}
        />
      )}
      <div
        className={cn(
          "flex flex-col rounded-md border bg-card transition-all duration-300",
          isMaximized
            ? "fixed inset-4 z-[100] h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] shadow-2xl"
            : "h-[600px] relative",
        )}
      >
        <div className="flex justify-between items-center border-b p-3 bg-muted/10">
          <div className="text-sm text-muted-foreground">
            Drag handles to connect. Double-click step nodes to edit. Double-click lines (connections) to delete them.
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMaximized((v) => !v)}
              className="font-semibold shadow-sm"
            >
              {isMaximized ? (
                <>
                  <Minimize2 className="mr-1.5 h-4 w-4" /> Minimize
                </>
              ) : (
                <>
                  <Maximize2 className="mr-1.5 h-4 w-4" /> Maximize
                </>
              )}
            </Button>
            <Button size="sm" onClick={handleAddStep} className="font-semibold shadow-sm">
              <Plus className="mr-1.5 h-4 w-4" /> Add Step Node
            </Button>
          </div>
        </div>

        <div className="flex-1 w-full h-full relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            onEdgeDoubleClick={onEdgeDoubleClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-muted/5"
          >
            <Background gap={12} size={1} />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>

        {/* Editing Drawer Sheet */}
        <Sheet open={!!editingStep} onOpenChange={(open) => !open && setEditingStep(null)}>
          <SheetContent className="sm:max-w-xl overflow-y-auto z-[110]">
            <SheetHeader className="border-b pb-4 mb-4 flex-row items-center justify-between space-y-0">
              <div>
                <SheetTitle>Edit Step Details</SheetTitle>
                <SheetDescription>Configure step outcomes, responsibilities, and details</SheetDescription>
              </div>
              {editingStep?.id && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                  onClick={() => handleDeleteStep(editingStep.id!)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </SheetHeader>

            {editingStep && (
              <div className="space-y-5 pb-8">
                <div className="space-y-2">
                  <Label htmlFor="step-name">Step Name</Label>
                  <Input
                    id="step-name"
                    value={editingStep.name}
                    onChange={(e) => updateEditingStep({ name: e.target.value })}
                  />
                </div>

                {/* Outcomes Management */}
                <div className="rounded-md border p-4 space-y-3 bg-muted/5">
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm">Step Outcomes (Branching Paths & Triggers)</h4>
                    <p className="text-xs text-muted-foreground">
                      Define step outcomes. Each outcome connects to a next step on the canvas and can optionally
                      trigger another workflow upon selection.
                    </p>
                  </div>

                  <div className="space-y-2 rounded-md border bg-background p-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="new-outcome-name" className="text-xs font-medium">
                        Outcome Name
                      </Label>
                      <Input
                        id="new-outcome-name"
                        placeholder="e.g. Approved, Rejected, Completed"
                        value={newOutcomeName}
                        onChange={(e) => setNewOutcomeName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddOutcome()}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="new-outcome-trigger" className="text-xs font-medium">
                        Trigger Another Workflow (Optional)
                      </Label>
                      <Select value={newTriggerWorkflowTemplateId} onValueChange={setNewTriggerWorkflowTemplateId}>
                        <SelectTrigger id="new-outcome-trigger" className="w-full text-xs">
                          <SelectValue placeholder="None (Don't trigger workflow)" />
                        </SelectTrigger>
                        <SelectContent className="z-[120]">
                          <SelectItem value="none">None (Don't trigger workflow)</SelectItem>
                          {availableTemplates.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleAddOutcome}
                      className="w-full font-semibold mt-1"
                      disabled={!newOutcomeName.trim()}
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Add Outcome
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {(editingStep.outcomes || []).map((outcome) => (
                      <div
                        key={outcome.id}
                        className="flex flex-col gap-2 bg-card border rounded-md p-2.5 text-sm shadow-xs"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-xs text-foreground">{outcome.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemoveOutcome(outcome.id)}
                            title="Remove outcome"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 pt-1 border-t">
                          <span className="text-[11px] text-muted-foreground shrink-0">Trigger:</span>
                          <Select
                            value={outcome.triggerWorkflowTemplateId || "none"}
                            onValueChange={(val) => handleUpdateOutcomeTrigger(outcome.id, val)}
                          >
                            <SelectTrigger className="h-7 text-[11px] w-full bg-muted/20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-[120]">
                              <SelectItem value="none">None (Don't trigger workflow)</SelectItem>
                              {availableTemplates.map((t) => (
                                <SelectItem key={t.id} value={t.id}>
                                  {t.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                    {(editingStep.outcomes || []).length === 0 && (
                      <div className="text-center text-xs text-muted-foreground py-3 italic border border-dashed rounded bg-background">
                        No branching outcomes. Step will lead to the next node by default.
                      </div>
                    )}
                  </div>
                </div>

                {/* Responsibility & Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="step-responsibility">Responsibility</Label>
                    <Select
                      value={editingStep.responsibility}
                      onValueChange={(val) => updateEditingStep({ responsibility: val })}
                    >
                      <SelectTrigger id="step-responsibility" className="w-full">
                        <SelectValue placeholder="Select Responsibility" />
                      </SelectTrigger>
                      <SelectContent className="z-[120]">
                        <SelectItem value="client_company">Client / Company</SelectItem>
                        {teams.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="step-priority">Priority</Label>
                    <Select
                      value={editingStep.priority}
                      onValueChange={(val) => updateEditingStep({ priority: val as WorkflowPriority })}
                    >
                      <SelectTrigger id="step-priority" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[120]">
                        {WORKFLOW_PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Due Date Config */}
                <div className="rounded-md border p-4 space-y-3 bg-muted/5">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="sheet-set-due"
                      checked={editingStep.setDueDate}
                      onCheckedChange={(checked) => updateEditingStep({ setDueDate: checked === true })}
                    />
                    <Label htmlFor="sheet-set-due" className="font-semibold text-sm">
                      Set due date
                    </Label>
                  </div>

                  {editingStep.setDueDate && (
                    <div className="flex flex-col gap-3 pl-6 pt-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">Resolve due date</span>
                        <Select
                          value={String(editingStep.dueDays ?? 1)}
                          onValueChange={(val) => updateEditingStep({ dueDays: Number(val) })}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[120]">
                            {WORKFLOW_DUE_DAYS.map((d) => (
                              <SelectItem key={d} value={String(d)}>
                                {d}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-muted-foreground">day(s) from</span>
                      </div>

                      <Select
                        value={editingStep.dueDateBase ?? "workflow_start"}
                        onValueChange={(val) => updateEditingStep({ dueDateBase: val as WorkflowDueDateBase })}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[120]">
                          {WORKFLOW_DUE_DATE_BASES.map((b) => (
                            <SelectItem key={b} value={b}>
                              {DUE_DATE_BASE_LABELS[b]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Rich Text Description */}
                <div className="space-y-2">
                  <Label>Description</Label>
                  <RichTextEditor
                    value={editingStep.description ?? ""}
                    onChange={(html) => updateEditingStep({ description: html })}
                    placeholder="Describe what needs to happen in this step…"
                  />
                </div>

                {/* Attachments */}
                <div className="space-y-2">
                  <Label>File Attachments</Label>
                  <div className="flex flex-wrap items-center gap-2">
                    {(editingStep.attachments ?? []).map((attachment) => (
                      <Badge key={attachment.id} variant="secondary" className="gap-1.5 py-1 pr-1 pl-2">
                        <Paperclip className="h-3 w-3" />
                        <a
                          href={attachment.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="max-w-40 truncate hover:underline"
                        >
                          {attachment.fileName}
                        </a>
                        <button
                          type="button"
                          className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                          onClick={() =>
                            updateEditingStep({
                              attachments: (editingStep.attachments ?? []).filter((a) => a.id !== attachment.id),
                            })
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
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {isUploading ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <Paperclip className="mr-1.5 h-4 w-4" />
                      )}
                      {isUploading ? "Uploading..." : "Attach Files"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
