"use client";

import * as React from "react";

import Link from "next/link";

import { Briefcase, Building2, MessageSquare } from "lucide-react";

import { getNoteThread } from "@/actions/notes";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { NoteNode } from "@/types/notes";

import { NoteItem } from "./note-item";

function countReplies(node: NoteNode): number {
  return node.replies.reduce((acc, child) => acc + 1 + countReplies(child), 0);
}

interface NoteThreadProps {
  noteId: string;
}

export function NoteThread({ noteId }: NoteThreadProps) {
  const [thread, setThread] = React.useState<NoteNode | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const res = await getNoteThread(noteId);
    if (res.success && res.thread) {
      setThread(res.thread);
      setError(null);
    } else {
      setError(res.error || "Note not found");
    }
    setLoading(false);
  }, [noteId]);

  React.useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <Card>
        <CardContent className="space-y-3 p-4">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </CardContent>
      </Card>
    );
  }

  if (error || !thread) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground text-sm">{error || "Note not found"}</CardContent>
      </Card>
    );
  }

  const replies = countReplies(thread);

  return (
    <Card>
      <CardContent className="p-4 md:p-5">
        {thread.associations.length > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            {thread.associations.map((a) => (
              <Link
                key={`${a.entityType}:${a.entityId}`}
                href={`/dashboard/crm/${a.entityType === "client" ? "clients" : "companies"}/${a.entityId}/internal/notes`}
              >
                <Badge variant="secondary" className="gap-1 hover:bg-secondary/80">
                  {a.entityType === "client" ? <Briefcase className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
                  {a.name}
                </Badge>
              </Link>
            ))}
          </div>
        )}

        <NoteItem node={thread} onChanged={load} />

        <div className="mt-4 flex items-center gap-1.5 border-t pt-3 text-muted-foreground text-xs">
          <MessageSquare className="h-3.5 w-3.5" />
          {replies} {replies === 1 ? "reply" : "replies"}
        </div>
      </CardContent>
    </Card>
  );
}
