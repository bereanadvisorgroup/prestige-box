"use client";

import * as React from "react";

import Link from "next/link";

import { format } from "date-fns";
import { ArrowUpRight, CheckCircle2, ListTodo } from "lucide-react";

import { getUpcomingTasksForUser } from "@/actions/tasks";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth.store";
import type { TaskWithRelations } from "@/types/crm";

import { STATUS_STYLES } from "./task-meta";

export function DashboardTasksCard() {
  const profile = useAuthStore((s) => s.profile);
  const [tasks, setTasks] = React.useState<TaskWithRelations[]>([]);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (!profile?.uid) return;
    let cancelled = false;
    (async () => {
      const res = await getUpcomingTasksForUser(profile.uid, 5);
      if (!cancelled) {
        if (res.success && res.tasks) setTasks(res.tasks);
        setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile?.uid]);

  return (
    <Card className="group transition-all hover:border-primary/50 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 font-bold text-base">
          <ListTodo className="h-5 w-5 text-primary" />
          My Upcoming Tasks
        </CardTitle>
        <Link
          href="/dashboard/crm/tasks"
          className="flex items-center gap-1 text-muted-foreground text-xs hover:text-primary"
        >
          View all
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent>
        {!loaded ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : tasks.length === 0 ? (
          <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
            <CheckCircle2 className="h-4 w-4" />
            No upcoming tasks. You&apos;re all caught up.
          </div>
        ) : (
          <ul className="divide-y">
            {tasks.map((task) => {
              const due = task.dueDate ? new Date(task.dueDate) : null;
              const overdue = due && due.getTime() < Date.now();
              return (
                <li key={task.id}>
                  <Link
                    href="/dashboard/crm/tasks"
                    className="-mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-sm">{task.name}</p>
                      {due && (
                        <p className={`text-xs ${overdue ? "font-medium text-rose-600" : "text-muted-foreground"}`}>
                          Due {format(due, "MMM d, yyyy")}
                          {overdue && " · overdue"}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className={STATUS_STYLES[task.status]}>
                      {task.status}
                    </Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
