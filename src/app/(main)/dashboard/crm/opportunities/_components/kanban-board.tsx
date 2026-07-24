"use client";

import * as React from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { differenceInCalendarDays, format, startOfDay } from "date-fns";
import { ArrowUpRight, DollarSign, GitFork, GripVertical, Percent, Plus, Trash2, Trophy, XCircle } from "lucide-react";
import { toast } from "sonner";

import { updateOpportunity } from "@/actions/opportunities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { OpportunityDialog } from "./opportunity-dialog";
import { ResultDialog } from "./result-dialog";

// -------------------------------------------------------------
// Draggable Card
// -------------------------------------------------------------
function OpportunityCard({
  opportunity,
  onClick,
  dragging,
}: {
  opportunity: any;
  onClick: () => void;
  dragging?: boolean;
}) {
  const isCompany = !!opportunity.companyId;
  const name = isCompany
    ? opportunity.company?.name || "Unnamed Company"
    : opportunity.client?.person
      ? `${opportunity.client.person.firstName} ${opportunity.client.person.lastName}`
      : "Unnamed Client";

  const closeDate = opportunity.targetCloseDate ? format(new Date(opportunity.targetCloseDate), "MMM d, yyyy") : null;

  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number.parseFloat(opportunity.amount || "0"));

  let dateStatus: "error" | "warning" | "none" = "none";
  if (opportunity.targetCloseDate && !opportunity.resultStatus) {
    const today = startOfDay(new Date());
    const targetDate = startOfDay(new Date(opportunity.targetCloseDate));
    const diffDays = differenceInCalendarDays(targetDate, today);

    if (diffDays <= 0) {
      dateStatus = "error";
    } else if (diffDays <= 7) {
      dateStatus = "warning";
    }
  }

  return (
    <div
      className={cn(
        "rounded-lg border p-4 shadow-sm transition-all hover:shadow-md select-none relative",
        dateStatus === "error" &&
          "bg-rose-50/90 border-rose-300 text-rose-950 dark:bg-rose-950/40 dark:border-rose-800/70 dark:text-rose-100",
        dateStatus === "warning" &&
          "bg-amber-50/90 border-amber-300 text-amber-950 dark:bg-amber-950/40 dark:border-amber-800/70 dark:text-amber-100",
        dateStatus === "none" && "bg-card border-border",
        dragging && "opacity-50 border-primary/40 shadow-inner",
      )}
    >
      <div className="flex items-start justify-between gap-4 pr-6">
        <div className="space-y-1">
          {isCompany ? (
            <Link
              href={`/dashboard/crm/companies/${opportunity.companyId}/internal/opportunities`}
              className="text-sm font-bold text-primary hover:underline inline-flex items-center gap-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              <span>{name}</span>
              <ArrowUpRight className="h-3 w-3 opacity-60" />
            </Link>
          ) : (
            <Link
              href={`/dashboard/crm/clients/${opportunity.clientId}/internal/opportunities`}
              className="text-sm font-bold text-primary hover:underline inline-flex items-center gap-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              <span>{name}</span>
              <ArrowUpRight className="h-3 w-3 opacity-60" />
            </Link>
          )}

          {opportunity.companyId && opportunity.client?.person && (
            <p className="text-xs text-muted-foreground">
              Re: {opportunity.client.person.firstName} {opportunity.client.person.lastName}
            </p>
          )}
        </div>
        <Badge
          variant="secondary"
          className="h-5 px-1.5 text-[10px] gap-0.5 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 border-blue-200"
        >
          <span>{opportunity.probabilityWin}%</span>
        </Badge>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <span className="font-extrabold text-sm text-foreground">{formattedAmount}</span>
        {closeDate && (
          <span
            className={cn(
              "text-[10px]",
              dateStatus === "error" && "font-semibold text-rose-700 dark:text-rose-400",
              dateStatus === "warning" && "font-semibold text-amber-700 dark:text-amber-400",
              dateStatus === "none" && "text-muted-foreground",
            )}
          >
            {closeDate}
          </span>
        )}
      </div>
    </div>
  );
}

function DraggableCard({ opportunity, onCardClick }: { opportunity: any; onCardClick: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: opportunity.id,
  });

  return (
    <div ref={setNodeRef} className="relative group">
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute top-4 right-3 cursor-grab text-muted-foreground/60 active:cursor-grabbing hover:text-foreground z-10"
        aria-label="Drag opportunity"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div onClick={onCardClick} className="cursor-pointer">
        <OpportunityCard opportunity={opportunity} dragging={isDragging} onClick={onCardClick} />
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Droppable Column
// -------------------------------------------------------------
function KanbanColumn({
  stage,
  opportunities,
  onCardClick,
}: {
  stage: any;
  opportunities: any[];
  onCardClick: (opp: any) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  // Sum of opportunities in this column
  const totalAmount = opportunities.reduce((sum, o) => sum + Number.parseFloat(o.amount || "0"), 0);
  const formattedTotal = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(totalAmount);

  return (
    <div className="flex min-w-[280px] flex-1 flex-col rounded-xl bg-muted/40 border border-muted/20">
      <div className="flex items-center justify-between px-4 py-3 border-b border-muted/10">
        <div>
          <h3 className="font-bold text-sm text-foreground leading-none">{stage.name}</h3>
          <span className="text-[10px] text-muted-foreground font-medium">{formattedTotal} total</span>
        </div>
        <Badge variant="outline" className="h-5 px-1.5 text-xs text-muted-foreground">
          {opportunities.length}
        </Badge>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[350px] flex-1 flex-col gap-3 p-3 transition-colors",
          isOver && "bg-accent/40 rounded-b-xl border-dashed border-2 border-primary/20",
        )}
      >
        {opportunities.map((opp) => (
          <DraggableCard key={opp.id} opportunity={opp} onCardClick={() => onCardClick(opp)} />
        ))}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Droppable Bottom Result Zone
// -------------------------------------------------------------
function ResultDropZone({
  id,
  title,
  icon: Icon,
  colorClass,
  hoverClass,
}: {
  id: "TRASH" | "WON" | "LOST";
  title: string;
  icon: any;
  colorClass: string;
  hoverClass: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `result-${id}` });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-1 flex items-center justify-center gap-2 border-2 border-dashed py-4 rounded-xl transition-all duration-300",
        colorClass,
        isOver && cn("scale-[1.02] border-solid shadow-md", hoverClass),
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="font-bold text-sm tracking-wide uppercase">{title}</span>
    </div>
  );
}

// -------------------------------------------------------------
// Main Kanban Board Component
// -------------------------------------------------------------
interface KanbanBoardProps {
  initialOpportunities: any[];
  pipelines: any[];
  clients: any[];
  companies: any[];
}

export function KanbanBoard({ initialOpportunities, pipelines, clients, companies }: KanbanBoardProps) {
  const router = useRouter();
  const [opportunities, setOpportunities] = React.useState(initialOpportunities);
  const [selectedPipelineId, setSelectedPipelineId] = React.useState<string>("");
  const [activeId, setActiveId] = React.useState<string | null>(null);

  // Dialog states
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = React.useState<any | null>(null);

  // Result dialog states
  const [resultDialogOpen, setResultDialogOpen] = React.useState(false);
  const [resultStatus, setResultStatus] = React.useState<"WON" | "LOST" | "TRASH" | null>(null);
  const [pendingOppId, setPendingOppId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  // Set initial pipeline
  React.useEffect(() => {
    const stillExists = pipelines.some((p) => p.id === selectedPipelineId);
    if (selectedPipelineId && stillExists) return;

    const activePipelines = pipelines.filter((p) => p.isActive);
    if (activePipelines.length > 0) {
      setSelectedPipelineId(activePipelines[0].id);
    } else if (pipelines.length > 0) {
      setSelectedPipelineId(pipelines[0].id);
    }
  }, [pipelines, selectedPipelineId]);

  // Update local opportunities when server updates prop
  React.useEffect(() => {
    setOpportunities(initialOpportunities);
  }, [initialOpportunities]);

  const activePipeline = React.useMemo(() => {
    return pipelines.find((p) => p.id === selectedPipelineId);
  }, [selectedPipelineId, pipelines]);

  const stages = React.useMemo(() => {
    return activePipeline?.stages || [];
  }, [activePipeline]);

  // Filter opportunities for active pipeline and active stages (resultStatus === null)
  const activeOpportunities = React.useMemo(() => {
    return opportunities.filter((o) => o.pipelineId === selectedPipelineId && !o.resultStatus);
  }, [opportunities, selectedPipelineId]);

  const byStage = React.useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const s of stages) map[s.id] = [];
    for (const o of activeOpportunities) {
      if (map[o.stageId]) {
        map[o.stageId].push(o);
      }
    }
    return map;
  }, [activeOpportunities, stages]);

  const activeOppForOverlay = React.useMemo(() => {
    return opportunities.find((o) => o.id === activeId) || null;
  }, [activeId, opportunities]);

  // -------------------------------------------------------------
  // Totals calculations
  // -------------------------------------------------------------
  const totalActiveAmount = React.useMemo(() => {
    return activeOpportunities.reduce((sum, o) => sum + Number.parseFloat(o.amount || "0"), 0);
  }, [activeOpportunities]);

  const totalProbWinAmount = React.useMemo(() => {
    return activeOpportunities.reduce(
      (sum, o) => sum + Number.parseFloat(o.amount || "0") * ((o.probabilityWin || 0) / 100),
      0,
    );
  }, [activeOpportunities]);

  const formattedTotalActive = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(totalActiveAmount);

  const formattedTotalProb = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(totalProbWinAmount);

  // -------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------
  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const oppId = active.id as string;
    const dropTarget = over.id as string;

    // Check if dropped into a Result Zone
    if (dropTarget.startsWith("result-")) {
      const status = dropTarget.replace("result-", "") as "WON" | "LOST" | "TRASH";
      setResultStatus(status);
      setPendingOppId(oppId);
      setResultDialogOpen(true);
      return;
    }

    // Dropped into a stage column
    const targetStageId = dropTarget;
    const stageExists = stages.some((s: any) => s.id === targetStageId);

    if (stageExists) {
      const opp = opportunities.find((o) => o.id === oppId);
      if (opp && opp.stageId !== targetStageId) {
        // Optimistic UI update
        const updated = opportunities.map((o) => (o.id === oppId ? { ...o, stageId: targetStageId } : o));
        setOpportunities(updated);

        try {
          const result = await updateOpportunity(oppId, { stageId: targetStageId });
          if (!result.success) {
            toast.error("Failed to update opportunity stage");
            setOpportunities(opportunities); // Revert
          }
        } catch (error) {
          console.error(error);
          setOpportunities(opportunities); // Revert
        }
      }
    }
  }

  function handleAdd() {
    setSelectedOpportunity(null);
    setDialogOpen(true);
  }

  function handleCardClick(opp: any) {
    setSelectedOpportunity(opp);
    setDialogOpen(true);
  }

  // Refetch action / refresh page on save
  const handleSaved = () => {
    toast.success("Saved successfully");
    // Trigger router refresh to reload server side data
    router.refresh();
  };

  const pendingOppName = React.useMemo(() => {
    if (!pendingOppId) return "";
    const opp = opportunities.find((o) => o.id === pendingOppId);
    if (!opp) return "";
    return opp.company
      ? opp.company.name
      : opp.client?.person
        ? `${opp.client.person.firstName} ${opp.client.person.lastName}`
        : "Opportunity";
  }, [pendingOppId, opportunities]);

  if (pipelines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 border border-dashed rounded-2xl p-16 bg-card">
        <GitFork className="h-12 w-12 text-muted-foreground/60" />
        <h2 className="font-bold text-xl">No Pipelines Created</h2>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          You must define an Opportunity Pipeline in the admin settings before managing opportunities.
        </p>
        <Button asChild className="mt-2 font-semibold">
          <Link href="/dashboard/admin/opportunities/new">Create a Pipeline</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="font-extrabold text-3xl tracking-tight">Opportunities</h1>
          <Select value={selectedPipelineId} onValueChange={setSelectedPipelineId}>
            <SelectTrigger className="w-[180px] bg-card border font-medium text-sm">
              <SelectValue placeholder="Select Pipeline" />
            </SelectTrigger>
            <SelectContent>
              {pipelines.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleAdd} className="font-semibold shadow-sm gap-1.5 self-start sm:self-auto">
          <Plus className="h-4 w-4" /> Add Opportunity
        </Button>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* Kanban Columns */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage: any) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              opportunities={byStage[stage.id] || []}
              onCardClick={handleCardClick}
            />
          ))}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeOppForOverlay ? <OpportunityCard opportunity={activeOppForOverlay} onClick={() => {}} /> : null}
        </DragOverlay>

        {/* Bottom Droppable Zones */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-muted-foreground tracking-wider uppercase">Drag here to close</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <ResultDropZone
              id="WON"
              title="Mark Won"
              icon={Trophy}
              colorClass="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/10 dark:text-emerald-400"
              hoverClass="border-emerald-400 bg-emerald-100/50 dark:border-emerald-600 dark:bg-emerald-950/20"
            />
            <ResultDropZone
              id="LOST"
              title="Mark Lost"
              icon={XCircle}
              colorClass="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/10 dark:text-rose-400"
              hoverClass="border-rose-400 bg-rose-100/50 dark:border-rose-600 dark:bg-rose-950/20"
            />
            <ResultDropZone
              id="TRASH"
              title="Send to Trash"
              icon={Trash2}
              colorClass="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/10 dark:text-amber-400"
              hoverClass="border-amber-400 bg-amber-100/50 dark:border-amber-600 dark:bg-amber-950/20"
            />
          </div>
        </div>
      </DndContext>

      {/* Totals Summary Cards */}
      <div className="grid gap-6 sm:grid-cols-2 pt-4">
        <Card className="border bg-gradient-to-br from-card to-muted/20 shadow-sm">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Active Amount
              </p>
              <h2 className="font-extrabold text-2xl tracking-tight mt-1">{formattedTotalActive}</h2>
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-gradient-to-br from-card to-muted/20 shadow-sm">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Percent className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Probability Win Amount
              </p>
              <h2 className="font-extrabold text-2xl tracking-tight mt-1">{formattedTotalProb}</h2>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Opportunity Dialog */}
      <OpportunityDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        opportunity={selectedOpportunity}
        pipelines={pipelines}
        clients={clients}
        companies={companies}
        defaultPipelineId={selectedPipelineId}
        onSaved={handleSaved}
      />

      {/* Result Dialog */}
      <ResultDialog
        open={resultDialogOpen}
        onOpenChange={setResultDialogOpen}
        opportunityId={pendingOppId}
        opportunityName={pendingOppName}
        resultStatus={resultStatus}
        onSaved={handleSaved}
      />
    </div>
  );
}
