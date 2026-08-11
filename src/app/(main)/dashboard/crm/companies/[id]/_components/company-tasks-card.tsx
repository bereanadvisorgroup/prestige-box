"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowUpRight, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { createTask } from "@/actions/tasks";
import { getUsers } from "@/actions/users";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth.store";
import type { TaskWithRelations } from "@/types/crm";

interface CompanyTasksCardProps {
  companyId: string;
  initialTasks: TaskWithRelations[];
}

export function CompanyTasksCard({ companyId, initialTasks }: CompanyTasksCardProps) {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const [tasks, setTasks] = useState<TaskWithRelations[]>(initialTasks);
  const [taskName, setTaskName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  useEffect(() => {
    getUsers().then((res) => {
      if (res.success && res.users) {
        setUsers(res.users);
      }
    });
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    const assigneeId = profile?.uid || users[0]?.uid;
    if (!assigneeId) {
      toast.error("No valid assignee could be found for the task.");
      return;
    }

    try {
      setIsSubmitting(true);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7); // Default due date 7 days from now

      const res = await createTask({
        name: taskName.trim(),
        status: "New",
        category: "Other",
        priority: "Medium",
        dueDate: dueDate.toISOString(),
        assigneeIds: [assigneeId],
        associations: [{ entityType: "company", entityId: companyId }],
        attachments: [],
      });

      if (res.success) {
        toast.success("Task created");
        setTaskName("");
        router.refresh();
      } else {
        throw new Error(res.error || "Failed to create task");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeTasks = tasks.filter((t) => t.status !== "Complete");

  return (
    <Card className="border-none shadow-sm transition-shadow hover:shadow-md flex flex-col h-full min-h-[220px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl font-medium tracking-tight text-neutral-800 dark:text-neutral-200">
          Tasks:
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-1 max-h-[160px] scrollbar-thin">
          {activeTasks.length > 0 ? (
            activeTasks.map((task) => (
              <Link
                key={task.id}
                href={`/dashboard/crm/companies/${companyId}/internal/tasks?editTask=${task.id}`}
                className="group flex flex-col border-b border-neutral-100 dark:border-zinc-850 pb-2 last:border-0 last:pb-0 hover:bg-neutral-50 dark:hover:bg-zinc-800 p-1.5 rounded transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold text-neutral-750 dark:text-neutral-250 leading-tight group-hover:text-primary break-words">
                    {task.name}
                  </span>
                  <ArrowUpRight className="h-3 w-3 text-neutral-400 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all shrink-0 mt-0.5" />
                </div>
                {task.dueDate && (
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
              </Link>
            ))
          ) : (
            <p className="text-xs text-muted-foreground italic py-2">No active tasks.</p>
          )}
        </div>
        <form onSubmit={handleAddTask} className="flex gap-2 mt-auto">
          <Input
            placeholder="Quick add task..."
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            disabled={isSubmitting}
            className="h-8 text-xs bg-neutral-50 dark:bg-zinc-950 border-neutral-300 focus-visible:ring-neutral-400"
          />
          <Button
            type="submit"
            size="icon"
            variant="outline"
            disabled={isSubmitting || !taskName.trim()}
            className="h-8 w-8 border-neutral-300 hover:bg-neutral-100"
          >
            {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
