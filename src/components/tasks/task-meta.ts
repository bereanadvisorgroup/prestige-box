import type { TaskCategory, TaskPriority, TaskStatus } from "@/types/crm";

/** Ordered status columns for the Kanban board. */
export const TASK_STATUS_ORDER: TaskStatus[] = ["New", "In Process", "Waiting Input", "Complete"];

export const STATUS_STYLES: Record<TaskStatus, string> = {
  New: "bg-blue-100 text-blue-700 border-blue-200",
  "In Process": "bg-amber-100 text-amber-700 border-amber-200",
  "Waiting Input": "bg-purple-100 text-purple-700 border-purple-200",
  Complete: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export const PRIORITY_STYLES: Record<TaskPriority, string> = {
  Low: "bg-slate-100 text-slate-600 border-slate-200",
  Medium: "bg-amber-100 text-amber-700 border-amber-200",
  High: "bg-rose-100 text-rose-700 border-rose-200",
};

export const CATEGORY_STYLES: Record<TaskCategory, string> = {
  Other: "bg-slate-100 text-slate-600 border-slate-200",
  Birthday: "bg-pink-100 text-pink-700 border-pink-200",
  "Wedding Anniversary": "bg-violet-100 text-violet-700 border-violet-200",
  "Policy Renewal": "bg-cyan-100 text-cyan-700 border-cyan-200",
};
