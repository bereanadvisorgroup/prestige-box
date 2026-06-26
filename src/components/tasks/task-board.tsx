"use client";

import * as React from "react";

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
import { format } from "date-fns";
import { GripVertical } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TaskStatus, TaskWithRelations } from "@/types/crm";

import { CATEGORY_STYLES, PRIORITY_STYLES, STATUS_STYLES, TASK_STATUS_ORDER } from "./task-meta";

interface TaskBoardProps {
  tasks: TaskWithRelations[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onCardClick?: (task: TaskWithRelations) => void;
}

function TaskCard({ task, onClick, dragging }: { task: TaskWithRelations; onClick?: () => void; dragging?: boolean }) {
  const overdue = task.status !== "Complete" && task.dueDate && new Date(task.dueDate).getTime() < Date.now();
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md",
        dragging && "opacity-50",
      )}
    >
      <div className="flex items-start gap-2">
        <button type="button" onClick={onClick} className="flex-1 text-left">
          <p className="font-medium text-sm leading-snug">{task.name}</p>
        </button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1">
        <Badge variant="outline" className={cn("h-5 px-1.5 text-[10px]", PRIORITY_STYLES[task.priority])}>
          {task.priority}
        </Badge>
        {task.category !== "Other" && (
          <Badge variant="outline" className={cn("h-5 px-1.5 text-[10px]", CATEGORY_STYLES[task.category])}>
            {task.category}
          </Badge>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between text-muted-foreground text-xs">
        {task.dueDate && (
          <span className={cn(overdue && "font-medium text-rose-600")}>{format(new Date(task.dueDate), "MMM d")}</span>
        )}
        {task.assignees.length > 0 && <span className="truncate">{task.assignees.map((a) => a.name).join(", ")}</span>}
      </div>
    </div>
  );
}

function DraggableCard({
  task,
  onCardClick,
}: {
  task: TaskWithRelations;
  onCardClick?: (t: TaskWithRelations) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id as string });
  return (
    <div ref={setNodeRef} className="relative">
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute top-3 right-2 cursor-grab text-muted-foreground active:cursor-grabbing"
        aria-label="Drag task"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <TaskCard task={task} dragging={isDragging} onClick={() => onCardClick?.(task)} />
    </div>
  );
}

function Column({
  status,
  tasks,
  onCardClick,
}: {
  status: TaskStatus;
  tasks: TaskWithRelations[];
  onCardClick?: (t: TaskWithRelations) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div className="flex min-w-[260px] flex-1 flex-col rounded-lg bg-muted/40">
      <div className="flex items-center justify-between px-3 py-2">
        <Badge variant="outline" className={STATUS_STYLES[status]}>
          {status}
        </Badge>
        <span className="text-muted-foreground text-xs">{tasks.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn("flex min-h-[120px] flex-1 flex-col gap-2 p-2 transition-colors", isOver && "bg-accent/50")}
      >
        {tasks.map((task) => (
          <DraggableCard key={task.id} task={task} onCardClick={onCardClick} />
        ))}
      </div>
    </div>
  );
}

export function TaskBoard({ tasks, onStatusChange, onCardClick }: TaskBoardProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  const byStatus = React.useMemo(() => {
    const map: Record<string, TaskWithRelations[]> = {};
    for (const s of TASK_STATUS_ORDER) map[s] = [];
    for (const t of tasks) {
      if (!map[t.status]) map[t.status] = [];
      map[t.status].push(t);
    }
    return map;
  }, [tasks]);

  const activeTask = tasks.find((t) => t.id === activeId) ?? null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.status !== newStatus && TASK_STATUS_ORDER.includes(newStatus)) {
      onStatusChange(taskId, newStatus);
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {TASK_STATUS_ORDER.map((status) => (
          <Column key={status} status={status} tasks={byStatus[status] ?? []} onCardClick={onCardClick} />
        ))}
      </div>
      <DragOverlay>{activeTask ? <TaskCard task={activeTask} /> : null}</DragOverlay>
    </DndContext>
  );
}
