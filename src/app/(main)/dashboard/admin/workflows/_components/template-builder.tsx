"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { AlertTriangle, CheckCircle2, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { createWorkflowTemplate, updateWorkflowTemplate } from "@/actions/workflow-templates";
import { RichTextEditor } from "@/components/features/tasks/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { type WorkflowTemplate, WorkflowTemplateSchema, type WorkflowTemplateStep } from "@/types/workflows";

import { FlowEditor } from "./flow-editor";

interface TemplateBuilderProps {
  template?: WorkflowTemplate;
  teams?: Array<{ id: string; name: string }>;
}

export function TemplateBuilder({ template, teams = [] }: TemplateBuilderProps) {
  const router = useRouter();
  const [name, setName] = useState(template?.name ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [warnings, setWarnings] = useState<{
    isValid: boolean;
    unreachableSteps: string[];
    hasPathStartToEnd: boolean;
  } | null>(null);

  const initialGraph = useMemo(() => {
    if (template?.graph) return template.graph;
    return {
      nodes: [
        { id: "start", type: "start", position: { x: 100, y: 250 }, data: { label: "Start" } },
        { id: "end", type: "end", position: { x: 600, y: 250 }, data: { label: "End" } },
      ],
      edges: [],
    };
  }, [template]);

  const graphRef = useRef(initialGraph);
  const stepsRef = useRef<WorkflowTemplateStep[]>(template?.steps ?? []);

  const handleFlowChange = useCallback(
    (updatedGraph: { nodes: any[]; edges: any[] }, updatedSteps: WorkflowTemplateStep[]) => {
      graphRef.current = updatedGraph;
      stepsRef.current = updatedSteps;

      const validation = checkGraphConnectivity(updatedGraph.nodes || [], updatedGraph.edges || [], updatedSteps);
      setWarnings(validation);
    },
    [],
  );

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Workflow name is required");
      return;
    }

    const currentSteps = stepsRef.current;
    if (currentSteps.length === 0) {
      toast.error("Add at least one step to the workflow");
      return;
    }

    const currentGraph = graphRef.current;
    // Check if we have a connection from start to some step
    const startEdge = (currentGraph.edges || []).find((e: any) => e.source === "start");
    if (!startEdge) {
      toast.error("Connect the green 'Start' node to your first step!");
      return;
    }

    const payload = {
      name,
      description: description || null,
      graph: currentGraph,
      steps: currentSteps.map((s, idx) => ({ ...s, sortOrder: idx })),
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
        toast.success(template?.id ? "Workflow updated successfully" : "Workflow created successfully");
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
    <div className="space-y-6 max-w-full">
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

      {/* Workflow Warnings / Diagnostics Section */}
      <Card
        className={cn(
          "border transition-all duration-300 shadow-sm",
          warnings?.isValid === false
            ? "border-amber-300 bg-amber-50/50 dark:bg-amber-950/10 dark:border-amber-900/30"
            : warnings?.isValid === true
              ? "border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/10 dark:border-emerald-900/30"
              : "border-muted bg-muted/5",
        )}
      >
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            {warnings ? (
              warnings.isValid ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="font-semibold text-emerald-800 dark:text-emerald-300 text-sm">
                      Workflow is correct
                    </h3>
                    <p className="text-emerald-700/80 dark:text-emerald-400/80 text-xs">
                      All steps are connected and there is a valid path leading from Start to End.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                  <div className="space-y-1.5 flex-1">
                    <h3 className="font-semibold text-amber-800 dark:text-amber-300 text-sm">Workflow Warnings</h3>
                    <ul className="text-amber-700 dark:text-amber-400 text-xs space-y-1.5 list-disc pl-4 font-medium">
                      {!warnings.hasPathStartToEnd && (
                        <li>
                          No active path connects the green <strong>Start</strong> node to the red <strong>End</strong>{" "}
                          node.
                        </li>
                      )}
                      {warnings.unreachableSteps.length > 0 && (
                        <li>
                          Unlinked step(s):{" "}
                          <span className="font-semibold">{warnings.unreachableSteps.join(", ")}</span>.
                        </li>
                      )}
                    </ul>
                  </div>
                </>
              )
            ) : (
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" /> Running diagnostics...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-xl">Workflow Graph Editor</h2>
        </div>

        <FlowEditor initialGraph={initialGraph} steps={stepsRef.current} teams={teams} onChange={handleFlowChange} />
      </div>
    </div>
  );
}

function checkGraphConnectivity(nodes: any[], edges: any[], steps: WorkflowTemplateStep[]) {
  const adjList = new Map<string, string[]>();
  for (const node of nodes) {
    adjList.set(node.id, []);
  }

  for (const edge of edges) {
    if (adjList.has(edge.source)) {
      adjList.get(edge.source)!.push(edge.target);
    }
  }

  const visitedFromStart = new Set<string>();
  const queue: string[] = ["start"];
  visitedFromStart.add("start");

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = adjList.get(current) || [];
    for (const n of neighbors) {
      if (!visitedFromStart.has(n)) {
        visitedFromStart.add(n);
        queue.push(n);
      }
    }
  }

  const hasPathStartToEnd = visitedFromStart.has("end");
  const unreachableSteps: string[] = [];
  for (const step of steps) {
    if (!visitedFromStart.has(step.id!)) {
      unreachableSteps.push(step.name);
    }
  }

  return {
    isValid: unreachableSteps.length === 0 && hasPathStartToEnd,
    unreachableSteps,
    hasPathStartToEnd,
  };
}
