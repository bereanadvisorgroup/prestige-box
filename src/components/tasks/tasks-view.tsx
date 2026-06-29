"use client";

import * as React from "react";

import { KanbanSquare, List, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { getTasks, type TaskFilter, updateTaskStatus } from "@/actions/tasks";
import { getUsers } from "@/actions/users";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAuthStore } from "@/stores/auth.store";
import type { TaskAssociation, TaskStatus, TaskWithRelations } from "@/types/crm";

import { TaskBoard } from "./task-board";
import { applyTaskFilters, defaultTaskFilters, TaskFilters, type TaskFilterState } from "./task-filters";
import { TaskFormDialog } from "./task-form-dialog";
import { TaskList } from "./task-list";

interface TasksViewProps {
  /** Scope the tasks: omit for all tasks, or pass a client/company id. */
  scope?: TaskFilter;
  title?: string;
  description?: string;
}

function defaultAssociationsFor(scope?: TaskFilter): TaskAssociation[] {
  if (scope?.clientId) return [{ entityType: "client", entityId: scope.clientId }];
  if (scope?.companyId) return [{ entityType: "company", entityId: scope.companyId }];
  return [];
}

const isGlobalScope = (scope?: TaskFilter) => !scope?.clientId && !scope?.companyId;

export function TasksView({ scope, title = "Tasks", description }: TasksViewProps) {
  const profile = useAuthStore((s) => s.profile);
  const [tasks, setTasks] = React.useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [view, setView] = React.useState<"board" | "list">("board");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<TaskWithRelations | null>(null);
  const [assigneeOptions, setAssigneeOptions] = React.useState<{ value: string; label: string }[]>([]);

  // On the global tasks page, default the assignee filter to the signed-in user; otherwise show all.
  const [filters, setFilters] = React.useState<TaskFilterState>(() => ({
    ...defaultTaskFilters,
    assignee: isGlobalScope(scope) && profile?.uid ? profile.uid : "all",
  }));

  const updateFilters = React.useCallback((patch: Partial<TaskFilterState>) => {
    setFilters((cur) => ({ ...cur, ...patch }));
  }, []);

  const load = React.useCallback(async () => {
    setLoading(true);
    const res = await getTasks(scope ?? {});
    if (res.success && res.tasks) setTasks(res.tasks);
    else toast.error(res.error || "Failed to load tasks");
    setLoading(false);
  }, [scope]);

  React.useEffect(() => {
    load();
  }, [load]);

  // Load admin/advisor users for the assignee filter.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await getUsers();
      if (cancelled || !res.success || !res.users) return;
      setAssigneeOptions(
        res.users
          .filter((u) => u.role === "admin" || u.role === "advisor")
          .map((u) => ({ value: u.uid, label: `${u.firstName} ${u.lastName}`.trim() || u.email })),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredTasks = React.useMemo(() => applyTaskFilters(tasks, filters), [tasks, filters]);

  async function handleStatusChange(taskId: string, status: TaskStatus) {
    // Optimistic update; revert on failure.
    const prev = tasks;
    setTasks((cur) =>
      cur.map((t) =>
        t.id === taskId ? { ...t, status, completeDate: status === "Complete" ? new Date().toISOString() : null } : t,
      ),
    );
    const res = await updateTaskStatus(taskId, status);
    if (!res.success) {
      setTasks(prev);
      toast.error(res.error || "Failed to update status");
    }
  }

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(task: TaskWithRelations) {
    setEditing(task);
    setDialogOpen(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">{title}</h1>
          {description && <p className="text-muted-foreground text-sm">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(v) => v && setView(v as "board" | "list")}
            variant="outline"
          >
            <ToggleGroupItem value="board" aria-label="Board view">
              <KanbanSquare className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>

      <TaskFilters filters={filters} onChange={updateFilters} assigneeOptions={assigneeOptions} />

      {loading ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : view === "board" ? (
        <TaskBoard tasks={filteredTasks} onStatusChange={handleStatusChange} onCardClick={openEdit} />
      ) : (
        <TaskList data={filteredTasks} onRowClick={openEdit} />
      )}

      <TaskFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editing}
        defaultAssociations={defaultAssociationsFor(scope)}
        onSaved={load}
      />
    </div>
  );
}
