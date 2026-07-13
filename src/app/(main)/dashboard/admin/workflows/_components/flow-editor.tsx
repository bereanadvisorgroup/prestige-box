"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  addEdge,
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { ChevronDown, GripVertical, Loader2, Maximize2, Minimize2, Paperclip, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { RichTextEditor } from "@/components/tasks/rich-text-editor";
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
  WORKFLOW_DUE_DATE_BASES,
  WORKFLOW_DUE_DAYS,
  WORKFLOW_PRIORITIES,
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
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 font-bold text-white text-xs shadow-md border-2 border-emerald-600">
      Start
      <Handle
        type="source"
        position={Position.Right}
        id="default"
        className="w-3 h-3 bg-emerald-700 border-emerald-500"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// End Node
// ---------------------------------------------------------------------------
function EndNode() {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 font-bold text-white text-xs shadow-md border-2 border-red-600">
      End
      <Handle type="target" position={Position.Left} id="default" className="w-3 h-3 bg-red-700 border-red-500" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step Node (Custom React Flow Node)
// ---------------------------------------------------------------------------
function StepNode({ data, selected }: any) {
  const step = data.step;
  const outcomes = step.outcomes || [];

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
          <Badge variant="outline" className="px-1.5 py-0 text-[10px] capitalize">
            {step.responsibility === "advisor" ? "Advisor" : "Client"}
          </Badge>
        </div>
      </CardContent>

      {/* Target input handle */}
      <Handle type="target" position={Position.Left} id="input" className="w-2.5 h-2.5 bg-primary/70" />

      {/* Source outcome handles */}
      {outcomes.length === 0 ? (
        <Handle type="source" position={Position.Right} id="default" className="w-2.5 h-2.5 bg-primary/70" />
      ) : (
        outcomes.map((outcome: any, idx: number) => {
          const percent = outcomes.length === 1 ? 50 : 20 + (idx / (outcomes.length - 1)) * 60;
          return (
            <div key={outcome.id}>
              <span
                style={{ top: `${percent}%` }}
                className="absolute right-2.5 -translate-y-1/2 pr-1.5 text-[9px] font-bold text-muted-foreground bg-popover px-1 border rounded shadow-sm pointer-events-none z-10 opacity-80"
              >
                {outcome.name}
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
  initialGraph: { nodes: any[]; edges: any[] };
  steps: WorkflowTemplateStep[];
  onChange: (graph: { nodes: any[]; edges: any[] }, updatedSteps: WorkflowTemplateStep[]) => void;
}

export function FlowEditor({ initialGraph, steps, onChange }: FlowEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialGraph.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialGraph.edges || []);
  const [editingStep, setEditingStep] = useState<WorkflowTemplateStep | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newOutcomeName, setNewOutcomeName] = useState("");
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
          },
        };
      }
      return n;
    });

    onChange({ nodes: graphNodes, edges }, updatedSteps);
  }, [nodes, edges, stepMap, onChange]);

  // Hook nodes and edges change
  const handleNodesChange = useCallback(
    (changes: any) => {
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
    (changes: any) => {
      onEdgesChange(changes);
    },
    [onEdgesChange],
  );

  const onConnect = useCallback(
    (connection: any) => {
      const edge = {
        ...connection,
        id: `e-${connection.source}-${connection.target}-${connection.sourceHandle || "default"}`,
        markerEnd: { type: MarkerType.ArrowClosed },
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges],
  );

  const onEdgeDoubleClick = useCallback((_event: any, edge: any) => {
    setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    toast.success("Connection removed");
  }, [setEdges]);

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
              onEdit: () => startEditStep(node.id),
            },
          };
        }
        return node;
      }),
    );
  }, [stepMap, startEditStep, setNodes]);

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
      responsibility: "advisor",
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
    };

    updateEditingStep({
      outcomes: [...(editingStep.outcomes || []), nextOutcome],
    });
    setNewOutcomeName("");
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
        <div
          className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm transition-opacity duration-300"
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
                <h4 className="font-semibold text-sm">Step Outcomes (Branching Paths)</h4>
                <p className="text-xs text-muted-foreground">
                  Define outcomes. Each outcome will appear as an output handle on the node to connect to the next step.
                </p>

                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Approved, Rejected, Completed"
                    value={newOutcomeName}
                    onChange={(e) => setNewOutcomeName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddOutcome()}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={handleAddOutcome}>
                    Add
                  </Button>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {(editingStep.outcomes || []).map((outcome) => (
                    <div
                      key={outcome.id}
                      className="flex justify-between items-center bg-card border rounded p-2 text-sm"
                    >
                      <span className="font-medium text-xs">{outcome.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveOutcome(outcome.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {(editingStep.outcomes || []).length === 0 && (
                    <div className="text-center text-xs text-muted-foreground py-2 italic border border-dashed rounded">
                      No branching outcomes. Step will lead to the next node by default.
                    </div>
                  )}
                </div>
              </div>

              {/* Responsibility & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Responsibility</Label>
                  <RadioGroup
                    value={editingStep.responsibility}
                    onValueChange={(val) => updateEditingStep({ responsibility: val as any })}
                    className="flex flex-col gap-2 pt-1"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="advisor" id="sheet-resp-advisor" />
                      <Label htmlFor="sheet-resp-advisor" className="text-xs">
                        Advisor
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="client" id="sheet-resp-client" />
                      <Label htmlFor="sheet-resp-client" className="text-xs">
                        Client / Company
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="step-priority">Priority</Label>
                  <Select
                    value={editingStep.priority}
                    onValueChange={(val) => updateEditingStep({ priority: val as any })}
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
                      onValueChange={(val) => updateEditingStep({ dueDateBase: val as any })}
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
