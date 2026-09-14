"use client";

import * as React from "react";

import Link from "next/link";

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
import { ArrowUpRight, Briefcase, GripVertical, Mail, Phone, Plus, Target, UserCheck, X } from "lucide-react";
import { toast } from "sonner";

import { updateProspect } from "@/actions/prospects";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, formatPhoneNumber } from "@/lib/utils";
import {
  type Campaign,
  type EnrichedProspect,
  PROSPECT_SOURCES,
  PROSPECT_STAGES,
  type ProspectStage,
} from "@/types/prospects";

import { getScoreBadge, getStageBadgeStyle } from "./columns";

// -------------------------------------------------------------
// Draggable Prospect Card
// -------------------------------------------------------------
function ProspectCard({
  prospect,
  onClick,
  onConvert,
  dragging,
}: {
  prospect: EnrichedProspect;
  onClick: () => void;
  onConvert?: (e: React.MouseEvent) => void;
  dragging?: boolean;
}) {
  const displayName =
    [prospect.prefix, prospect.firstName, prospect.middleName, prospect.lastName, prospect.suffix]
      .filter(Boolean)
      .join(" ") || `${prospect.firstName} ${prospect.lastName}`.trim();
  const isConverted = !!prospect.convertedClientId;

  return (
    <Card
      className={cn(
        "group relative cursor-pointer border bg-card text-card-foreground shadow-xs transition-all hover:border-primary/50 hover:shadow-md",
        dragging && "rotate-2 scale-105 border-primary shadow-xl ring-2 ring-primary/20",
        isConverted && "border-emerald-500/30 bg-emerald-500/5",
      )}
      onClick={onClick}
    >
      <CardContent className="space-y-2 p-2.5">
        {/* Top bar: Score badge, Source, Campaign & Drag Handle */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {getScoreBadge(prospect.score ?? 0, prospect.scoreTemperature)}
            <Badge variant="secondary" className="px-1.5 py-0 font-normal text-[10px]">
              {prospect.source || "Direct"}
            </Badge>
            {prospect.primaryCampaignName && (
              <Badge
                variant="outline"
                className="max-w-[130px] truncate border-indigo-200 bg-indigo-50/60 px-1.5 py-0 font-normal text-[10px] text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300"
                title={prospect.primaryCampaignName}
              >
                <Target className="mr-0.5 inline h-2.5 w-2.5 shrink-0" />
                <span className="truncate">{prospect.primaryCampaignName}</span>
              </Badge>
            )}
          </div>
          <div className="text-muted-foreground/40 transition-colors group-hover:text-muted-foreground">
            <GripVertical className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Name & Job Title */}
        <div>
          <div className="flex items-center justify-between gap-1">
            <h4 className="flex items-center gap-1 font-semibold text-[13px] text-foreground leading-tight transition-colors hover:text-primary">
              <span className="truncate">{displayName}</span>
              {prospect.goesBy && (
                <span className="shrink-0 font-normal text-[11px] text-muted-foreground italic">
                  ({prospect.goesBy})
                </span>
              )}
            </h4>
            <Link
              href={`/dashboard/crm/prospects/${prospect.id}`}
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 text-muted-foreground/60 transition-colors hover:text-primary"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {prospect.jobTitle && (
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground leading-none">{prospect.jobTitle}</p>
          )}
        </div>

        {/* Company */}
        {prospect.company && (
          <div className="flex items-center gap-1.5 font-medium text-[11px] text-foreground/80">
            <Briefcase className="h-3 w-3 shrink-0 text-muted-foreground" />
            <span className="truncate">{prospect.company}</span>
          </div>
        )}

        {/* Contact snippets */}
        <div className="space-y-0.5 text-[11px] text-muted-foreground">
          {prospect.email && (
            <div className="flex items-center gap-1.5 truncate">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{prospect.email}</span>
            </div>
          )}
          {prospect.phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="h-3 w-3 shrink-0" />
              <span>{formatPhoneNumber(prospect.phone)}</span>
            </div>
          )}
        </div>

        {/* Footer: Assigned Rep & Convert Button */}
        <div className="mt-1 flex items-center justify-between border-border/50 border-t pt-1.5">
          <div className="flex items-center gap-1.5">
            <div className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-muted font-bold text-[9px] text-muted-foreground">
              {prospect.assignedRepName ? prospect.assignedRepName[0] : "U"}
            </div>
            <span className="max-w-[100px] truncate text-[10px] text-muted-foreground">
              {prospect.assignedRepName || "Unassigned"}
            </span>
          </div>

          {isConverted ? (
            <Badge
              variant="outline"
              className="border-emerald-200 bg-emerald-50 px-1.5 py-0 text-[10px] text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
            >
              Converted Client
            </Badge>
          ) : (
            onConvert && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5.5 gap-1 px-1.5 text-[10px] text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40"
                onClick={onConvert}
              >
                <UserCheck className="h-3 w-3" />
                <span>Convert</span>
              </Button>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// -------------------------------------------------------------
// Draggable Wrapper
// -------------------------------------------------------------
function DraggableProspectCard({
  prospect,
  onClick,
  onConvert,
}: {
  prospect: EnrichedProspect;
  onClick: () => void;
  onConvert: (prospect: EnrichedProspect) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: prospect.id!,
    data: { prospect },
  });

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={cn(isDragging && "pointer-events-none opacity-40")}>
      <ProspectCard
        prospect={prospect}
        onClick={onClick}
        onConvert={(e) => {
          e.stopPropagation();
          onConvert(prospect);
        }}
      />
    </div>
  );
}

// -------------------------------------------------------------
// Droppable Kanban Column
// -------------------------------------------------------------
function KanbanColumn({
  stage,
  prospects,
  onCardClick,
  onConvert,
  onAddProspect,
}: {
  stage: ProspectStage;
  prospects: EnrichedProspect[];
  onCardClick: (prospect: EnrichedProspect) => void;
  onConvert: (prospect: EnrichedProspect) => void;
  onAddProspect: (stage: ProspectStage) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
    data: { stage },
  });

  const avgScore = prospects.length
    ? Math.round(prospects.reduce((acc, p) => acc + (p.score ?? 0), 0) / prospects.length)
    : 0;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-[calc(100vh-290px)] min-h-[460px] w-80 shrink-0 flex-col rounded-xl border bg-muted/25 transition-colors duration-200",
        isOver && "border-primary/50 bg-primary/5 ring-1 ring-primary/20",
      )}
    >
      {/* Column Header */}
      <div className="flex shrink-0 items-center justify-between rounded-t-xl border-b bg-muted/40 px-3 py-2">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn("border px-2 py-0.5 font-semibold text-xs", getStageBadgeStyle(stage))}
          >
            {stage}
          </Badge>
          <span className="font-mono text-muted-foreground text-xs">({prospects.length})</span>
        </div>
        <div className="flex items-center gap-1.5">
          {prospects.length > 0 && (
            <span className="font-medium text-[10px] text-muted-foreground">Avg: {avgScore} pts</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={() => onAddProspect(stage)}
            title={`Add prospect in ${stage}`}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Cards Container with Vertical Scrolling */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
        {prospects.map((prospect) => (
          <DraggableProspectCard
            key={prospect.id}
            prospect={prospect}
            onClick={() => onCardClick(prospect)}
            onConvert={onConvert}
          />
        ))}

        {prospects.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-muted-foreground/20 border-dashed p-6 text-center text-muted-foreground/60 text-xs">
            Drag prospects here or click + to add
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Main Kanban Board Component
// -------------------------------------------------------------
interface KanbanBoardProps {
  initialProspects: EnrichedProspect[];
  campaigns?: Campaign[];
  onEdit: (prospect: EnrichedProspect) => void;
  onConvert: (prospect: EnrichedProspect) => void;
  onAddWithStage: (stage: ProspectStage) => void;
}

export function KanbanBoard({ initialProspects, campaigns = [], onEdit, onConvert, onAddWithStage }: KanbanBoardProps) {
  const [prospects, setProspects] = React.useState<EnrichedProspect[]>(initialProspects);
  const [activeProspect, setActiveProspect] = React.useState<EnrichedProspect | null>(null);

  // Filters state
  const [sourceFilter, setSourceFilter] = React.useState<string>("all");
  const [campaignFilter, setCampaignFilter] = React.useState<string>("all");

  React.useEffect(() => {
    setProspects(initialProspects);
  }, [initialProspects]);

  // Filtered prospects
  const filteredProspects = React.useMemo(() => {
    return prospects.filter((item) => {
      // 1. Source filter
      if (sourceFilter !== "all" && (item.source || "Direct") !== sourceFilter) {
        return false;
      }

      // 2. Campaign filter
      if (campaignFilter !== "all") {
        if (campaignFilter === "none" && item.primaryCampaignId) {
          return false;
        }
        if (campaignFilter !== "none" && item.primaryCampaignId !== campaignFilter) {
          return false;
        }
      }

      return true;
    });
  }, [prospects, sourceFilter, campaignFilter]);

  const hasActiveFilters = sourceFilter !== "all" || campaignFilter !== "all";

  const clearFilters = () => {
    setSourceFilter("all");
    setCampaignFilter("all");
  };

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 5,
    },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 200,
      tolerance: 5,
    },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const found = prospects.find((p) => p.id === active.id);
    if (found) {
      setActiveProspect(found);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveProspect(null);

    if (!over) return;

    const prospectId = active.id as string;
    const targetStage = over.id as ProspectStage;

    const current = prospects.find((p) => p.id === prospectId);
    if (!current || current.stage === targetStage) return;

    // Optimistic state update
    const previousStage = current.stage;
    setProspects((prev) => prev.map((p) => (p.id === prospectId ? { ...p, stage: targetStage } : p)));

    try {
      const res = await updateProspect(prospectId, { stage: targetStage });
      if (res.success) {
        toast.success(`Moved ${current.firstName} to "${targetStage}"`);
      } else {
        // Rollback
        setProspects((prev) => prev.map((p) => (p.id === prospectId ? { ...p, stage: previousStage } : p)));
        toast.error(res.error || "Failed to update prospect stage");
      }
    } catch {
      // Rollback
      setProspects((prev) => prev.map((p) => (p.id === prospectId ? { ...p, stage: previousStage } : p)));
      toast.error("Failed to update prospect stage");
    }
  };

  return (
    <div className="space-y-3">
      {/* Kanban Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Source filter */}
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {PROSPECT_SOURCES.map((src) => (
                <SelectItem key={src} value={src}>
                  {src}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Campaign filter */}
          <Select value={campaignFilter} onValueChange={setCampaignFilter}>
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <SelectValue placeholder="Campaign" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              <SelectItem value="none">Direct / No Campaign</SelectItem>
              {campaigns.map((camp) => (
                <SelectItem key={camp.id} value={camp.id!}>
                  {camp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 gap-1 px-2 text-muted-foreground text-xs hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
              <span>Reset Filters</span>
            </Button>
          )}
        </div>

        {hasActiveFilters && (
          <div className="text-[11px] text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filteredProspects.length}</span> of{" "}
            <span>{prospects.length}</span> prospects
          </div>
        )}
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pt-1 pb-6">
          {PROSPECT_STAGES.map((stage) => {
            const columnProspects = filteredProspects.filter((p) => p.stage === stage);
            return (
              <KanbanColumn
                key={stage}
                stage={stage}
                prospects={columnProspects}
                onCardClick={onEdit}
                onConvert={onConvert}
                onAddProspect={onAddWithStage}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeProspect ? (
            <div className="w-80">
              <ProspectCard prospect={activeProspect} onClick={() => undefined} dragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
