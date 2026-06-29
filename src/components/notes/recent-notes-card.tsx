"use client";

import * as React from "react";

import Link from "next/link";

import { formatDistanceToNow } from "date-fns";
import { ArrowUpRight, MessageSquare, StickyNote } from "lucide-react";

import { getRecentNotes } from "@/actions/notes";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { NoteSummary } from "@/types/notes";

export function RecentNotesCard() {
  const [notes, setNotes] = React.useState<NoteSummary[]>([]);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await getRecentNotes(5);
      if (!cancelled) {
        if (res.success && res.notes) setNotes(res.notes);
        setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card className="group transition-all hover:border-primary/50 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 font-bold text-base">
          <StickyNote className="h-5 w-5 text-primary" />
          Recent Notes
        </CardTitle>
        <Link
          href="/dashboard/crm/notes"
          className="flex items-center gap-1 text-muted-foreground text-xs hover:text-primary"
        >
          View all
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent>
        {!loaded ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : notes.length === 0 ? (
          <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
            <StickyNote className="h-4 w-4" />
            No notes yet. Start the first one.
          </div>
        ) : (
          <ul className="divide-y">
            {notes.map((note) => (
              <li key={note.id}>
                <Link
                  href={`/dashboard/crm/notes/${note.id}`}
                  className="-mx-2 flex items-start justify-between gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm">{note.title}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-muted-foreground text-xs">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {note.replyCount}
                      </span>
                      <span>·</span>
                      <span>{formatDistanceToNow(new Date(note.lastActivityAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                  {note.associations.length > 0 && (
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      {note.associations[0].name}
                      {note.associations.length > 1 ? ` +${note.associations.length - 1}` : ""}
                    </Badge>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
