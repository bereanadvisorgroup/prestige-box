"use client";

import * as React from "react";

import { KanbanSquare, List, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { getTaskCategories } from "@/actions/task-categories";
import { getTasks, type TaskFilter, updateTaskStatus } from "@/actions/tasks";
import { getUsers } from "@/actions/users";
import { ClientHeaderPortal } from "@/app/(main)/dashboard/crm/clients/[id]/_components/client-header-portal";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAuthStore } from "@/stores/auth.store";
import { DEFAULT_TASK_CATEGORIES, type TaskAssociation, type TaskStatus, type TaskWithRelations } from "@/types/crm";

import { TaskBoard } from "./task-board";
import { applyTaskFilters, defaultTaskFilters, type TaskFilterState, TaskFilters } from "./task-filters";
import { TaskFormDialog } from "./task-form-dialog";
import { TaskList } from "./task-list";

interface TasksViewProps {
  /** Scope the tasks: omit for all tasks, or pass a client/company id. */
  scope?: TaskFilter;
  title?: string;
  description?: string;
  useHeaderPortal?: boolean;
  editTaskId?: string;
}

function defaultAssociationsFor(scope?: TaskFilter): TaskAssociation[] {
  if (scope?.clientId) return [{ entityType: "client", entityId: scope.clientId }];
  if (scope?.companyId) return [{ entityType: "company", entityId: scope.companyId }];
  return [];
}

const isGlobalScope = (scope?: TaskFilter) => !scope?.clientId && !scope?.companyId;

export function TasksView({
  scope,
  title = "Tasks",
  description,
  useHeaderPortal = false,
  editTaskId,
}: TasksViewProps) {
  const profile = useAuthStore((s) => s.profile);
  const [tasks, setTasks] = React.useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [view, setView] = React.useState<"board" | "list">("board");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<TaskWithRelations | null>(null);
  const [assigneeOptions, setAssigneeOptions] = React.useState<{ value: string; label: string }[]>([]);
  const [categoryOptions, setCategoryOptions] = React.useState<string[]>(Array.from(DEFAULT_TASK_CATEGORIES));

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
    const [tasksRes, categoriesRes] = await Promise.all([getTasks(scope ?? {}), getTaskCategories()]);
    if (tasksRes.success && tasksRes.tasks) setTasks(tasksRes.tasks);
    else toast.error(tasksRes.error || "Failed to load tasks");

    if (categoriesRes.success && categoriesRes.taskCategories && categoriesRes.taskCategories.length > 0) {
      setCategoryOptions(categoriesRes.taskCategories.map((c) => c.name));
    }
    setLoading(false);
  }, [scope]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    if (editTaskId && tasks.length > 0) {
      const taskToEdit = tasks.find((t) => t.id === editTaskId);
      if (taskToEdit) {
        setEditing(taskToEdit);
        setDialogOpen(true);

        const params = new URLSearchParams(window.location.search);
        params.delete("editTask");
        const newRelativePathQuery = window.location.pathname + (params.toString() ? `?${params.toString()}` : "");
        window.history.replaceState(null, "", newRelativePathQuery);
      }
    }
  }, [editTaskId, tasks]);

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

  const isFiltered = React.useMemo(() => {
    const defaultAssignee = isGlobalScope(scope) && profile?.uid ? profile.uid : "all";
    return (
      filters.name !== "" ||
      filters.status !== "all" ||
      filters.assignee !== defaultAssignee ||
      filters.priority !== "all" ||
      filters.dueIn !== "all" ||
      filters.clientName !== "" ||
      filters.companyName !== "" ||
      filters.category !== "all"
    );
  }, [filters, scope, profile]);

  const handleClearFilters = React.useCallback(() => {
    setFilters({
      name: "",
      status: "all",
      assignee: isGlobalScope(scope) && profile?.uid ? profile.uid : "all",
      priority: "all",
      dueIn: "all",
      clientName: "",
      companyName: "",
      category: "all",
    });
  }, [scope, profile]);

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
      {useHeaderPortal && (
        <ClientHeaderPortal sectionName={title}>
          <Button onClick={openCreate} className="gap-1">
            <Plus className="h-4 w-4" /> Add Task
          </Button>
        </ClientHeaderPortal>
      )}

      {useHeaderPortal ? (
        <div className="flex justify-end">
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(v) => v && setView(v as "board" | "list")}
            variant="outline"
          >
            <ToggleGroupItem value="board" aria-label="Board View" title="Board View">
              <KanbanSquare className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List View" title="List View">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      ) : (
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
              <ToggleGroupItem value="board" aria-label="Board View" title="Board View">
                <KanbanSquare className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List View" title="List View">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
            <Button onClick={openCreate} className="gap-1">
              <Plus className="h-4 w-4" /> Add Task
            </Button>
          </div>
        </div>
      )}

      <TaskFilters
        filters={filters}
        onChange={updateFilters}
        assigneeOptions={assigneeOptions}
        categoryOptions={categoryOptions}
        showClientCompanyFilters={isGlobalScope(scope)}
        isFiltered={isFiltered}
        onClear={handleClearFilters}
      />

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
