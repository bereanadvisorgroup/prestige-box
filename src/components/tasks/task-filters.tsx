"use client";

import { endOfMonth, endOfWeek, isToday, startOfDay } from "date-fns";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskCategories, TaskPriorities, TaskStatuses, type TaskWithRelations } from "@/types/crm";

export type DueInFilter = "all" | "overdue" | "today" | "week" | "month";

export interface TaskFilterState {
  name: string;
  status: string; // "all" | TaskStatus
  assignee: string; // "all" | userId
  priority: string; // "all" | TaskPriority
  dueIn: DueInFilter;
  clientName: string;
  companyName: string;
  category: string; // "all" | TaskCategory
}

export const defaultTaskFilters: TaskFilterState = {
  name: "",
  status: "all",
  assignee: "all",
  priority: "all",
  dueIn: "all",
  clientName: "",
  companyName: "",
  category: "all",
};

const DUE_IN_OPTIONS: { value: DueInFilter; label: string }[] = [
  { value: "all", label: "Any time" },
  { value: "overdue", label: "Overdue" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
];

function matchesDueIn(task: TaskWithRelations, dueIn: DueInFilter, now: Date): boolean {
  if (dueIn === "all") return true;
  if (!task.dueDate) return false;
  const due = new Date(task.dueDate);
  const today = startOfDay(now);
  switch (dueIn) {
    case "overdue":
      return task.status !== "Complete" && due < today;
    case "today":
      return isToday(due);
    case "week":
      return due >= today && due <= endOfWeek(now);
    case "month":
      return due >= today && due <= endOfMonth(now);
    default:
      return true;
  }
}

/** Applies the task filter bar selections to a task list. */
export function applyTaskFilters(
  tasks: TaskWithRelations[],
  filters: TaskFilterState,
  now: Date = new Date(),
): TaskWithRelations[] {
  const term = filters.name.trim().toLowerCase();
  return tasks.filter((t) => {
    if (term && !t.name.toLowerCase().includes(term)) return false;
    if (filters.status !== "all" && t.status !== filters.status) return false;
    if (filters.priority !== "all" && t.priority !== filters.priority) return false;
    if (filters.assignee !== "all" && !t.assignees.some((a) => a.userId === filters.assignee)) return false;
    if (!matchesDueIn(t, filters.dueIn, now)) return false;
    if (filters.clientName.trim() !== "") {
      const cTerm = filters.clientName.trim().toLowerCase();
      if (!t.associations.some((a) => a.entityType === "client" && a.name.toLowerCase().includes(cTerm))) return false;
    }
    if (filters.companyName.trim() !== "") {
      const coTerm = filters.companyName.trim().toLowerCase();
      if (!t.associations.some((a) => a.entityType === "company" && a.name.toLowerCase().includes(coTerm)))
        return false;
    }
    if (filters.category !== "all" && t.category !== filters.category) return false;
    return true;
  });
}

interface TaskFiltersProps {
  filters: TaskFilterState;
  onChange: (patch: Partial<TaskFilterState>) => void;
  /** Admin/advisor users available as assignees. */
  assigneeOptions: { value: string; label: string }[];
  showClientCompanyFilters?: boolean;
  isFiltered?: boolean;
  onClear?: () => void;
}

export function TaskFilters({
  filters,
  onChange,
  assigneeOptions,
  showClientCompanyFilters = false,
  isFiltered = false,
  onClear,
}: TaskFiltersProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Search Bar Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-[150px] flex-1">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by name…"
            value={filters.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="pl-9 pr-9"
          />
          {filters.name && (
            <button
              type="button"
              onClick={() => onChange({ name: "" })}
              className="-translate-y-1/2 absolute top-1/2 right-3 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
            >
              <X className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">Clear name filter</span>
            </button>
          )}
        </div>

        {showClientCompanyFilters && (
          <>
            <div className="relative min-w-[150px] flex-1">
              <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter by client…"
                value={filters.clientName}
                onChange={(e) => onChange({ clientName: e.target.value })}
                className="pl-9 pr-9"
              />
              {filters.clientName && (
                <button
                  type="button"
                  onClick={() => onChange({ clientName: "" })}
                  className="-translate-y-1/2 absolute top-1/2 right-3 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                  <span className="sr-only">Clear client filter</span>
                </button>
              )}
            </div>

            <div className="relative min-w-[150px] flex-1">
              <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter by company…"
                value={filters.companyName}
                onChange={(e) => onChange({ companyName: e.target.value })}
                className="pl-9 pr-9"
              />
              {filters.companyName && (
                <button
                  type="button"
                  onClick={() => onChange({ companyName: "" })}
                  className="-translate-y-1/2 absolute top-1/2 right-3 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                  <span className="sr-only">Clear company filter</span>
                </button>
              )}
            </div>
            <Select value={filters.status} onValueChange={(v) => onChange({ status: v })}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {TaskStatuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.assignee} onValueChange={(v) => onChange({ assignee: v })}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                {assigneeOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.priority} onValueChange={(v) => onChange({ priority: v })}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {TaskPriorities.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.dueIn} onValueChange={(v) => onChange({ dueIn: v as DueInFilter })}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Due In" />
              </SelectTrigger>
              <SelectContent>
                {DUE_IN_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.category} onValueChange={(v) => onChange({ category: v })}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {TaskCategories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}

        {isFiltered && onClear && (
          <Button
            variant="ghost"
            onClick={onClear}
            className="shrink-0 px-3 text-muted-foreground hover:text-foreground"
          >
            Clear
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

    </div>
  );
}
