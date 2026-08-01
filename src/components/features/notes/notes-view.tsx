"use client";

import * as React from "react";

import Link from "next/link";

import { formatDistanceToNow } from "date-fns";
import {
  ArrowUpDown,
  Briefcase,
  Building2,
  MessageSquare,
  Paperclip,
  Plus,
  Search,
  StickyNote,
  TrendingUp,
  User,
} from "lucide-react";

import { getNotes, type NoteFilter } from "@/actions/notes";
import { ClientHeaderPortal } from "@/app/(main)/dashboard/crm/clients/[id]/_components/client-header-portal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { NoteAssociation, NoteSummary } from "@/types/notes";

import { NoteComposer } from "./note-composer";

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface NotesViewProps {
  scope?: NoteFilter;
  title?: string;
  description?: string;
  /** Pre-selected associations for newly created notes (scoped pages). */
  defaultAssociations?: NoteAssociation[];
  lockAssociations?: boolean;
  useHeaderPortal?: boolean;
}

function NoteSummaryCard({ note }: { note: NoteSummary }) {
  return (
    <Link href={`/dashboard/crm/notes/${note.id}`} className="block">
      <Card className="transition-all hover:border-primary/50 hover:shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-base leading-snug">{note.title}</h3>
            <span className="shrink-0 text-muted-foreground text-xs">
              {formatDistanceToNow(new Date(note.lastActivityAt), { addSuffix: true })}
            </span>
          </div>
          {note.excerpt && <p className="mt-1 line-clamp-2 text-muted-foreground text-sm">{note.excerpt}</p>}

          {note.associations.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {note.associations.map((a) => (
                <Badge key={`${a.entityType}:${a.entityId}`} variant="secondary" className="gap-1">
                  {a.entityType === "client" ? (
                    <Briefcase className="h-3 w-3" />
                  ) : a.entityType === "person" ? (
                    <User className="h-3 w-3" />
                  ) : (
                    <Building2 className="h-3 w-3" />
                  )}
                  {a.name}
                </Badge>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center gap-3 text-muted-foreground text-xs">
            <span className="flex items-center gap-1.5">
              <Avatar className="h-5 w-5">
                {note.author.photoURL ? <AvatarImage src={note.author.photoURL} alt={note.author.name} /> : null}
                <AvatarFallback className="text-[9px]">{initials(note.author.name)}</AvatarFallback>
              </Avatar>
              {note.author.name}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              {note.replyCount}
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              {note.score}
            </span>
            {note.attachmentCount > 0 && (
              <span className="flex items-center gap-1">
                <Paperclip className="h-3.5 w-3.5" />
                {note.attachmentCount}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function NotesView({
  scope,
  title = "Notes",
  description = "",
  defaultAssociations = [],
  lockAssociations = false,
  useHeaderPortal = false,
}: NotesViewProps) {
  const [notes, setNotes] = React.useState<NoteSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<"recent" | "top" | "replies">("recent");
  const [composing, setComposing] = React.useState(false);

  // Keyed on the scope's primitive ids so a fresh `{clientId}` object literal
  // from the parent on every render doesn't trigger a refetch loop.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional primitive deps, not the scope object identity
  const load = React.useCallback(async () => {
    const res = await getNotes(scope ?? {});
    if (res.success) setNotes(res.notes || []);
    setLoading(false);
  }, [scope?.clientId, scope?.companyId, scope?.personId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = notes;
    if (q) {
      list = notes.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.excerpt.toLowerCase().includes(q) ||
          n.author.name.toLowerCase().includes(q) ||
          n.associations.some((a) => a.name.toLowerCase().includes(q)),
      );
    }
    const sorted = [...list];
    if (sort === "top") sorted.sort((a, b) => b.score - a.score);
    else if (sort === "replies") sorted.sort((a, b) => b.replyCount - a.replyCount);
    else sorted.sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));
    return sorted;
  }, [notes, query, sort]);

  return (
    <div className="flex flex-col gap-4">
      {useHeaderPortal && (
        <ClientHeaderPortal sectionName={title}>
          {!composing && (
            <Button onClick={() => setComposing(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />
              New note
            </Button>
          )}
        </ClientHeaderPortal>
      )}

      {!useHeaderPortal && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 font-bold text-2xl">
              <StickyNote className="h-6 w-6 text-primary" />
              {title}
            </h1>
            <p className="text-muted-foreground text-sm">{description}</p>
          </div>
          {!composing && (
            <Button onClick={() => setComposing(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />
              New note
            </Button>
          )}
        </div>
      )}

      {composing && (
        <NoteComposer
          mode="note"
          defaultAssociations={defaultAssociations}
          lockAssociations={lockAssociations}
          onSubmitted={() => {
            setComposing(false);
            setLoading(true);
            load();
          }}
          onCancel={() => setComposing(false)}
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search notes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
          <SelectTrigger className="w-40">
            <ArrowUpDown className="mr-1 h-3.5 w-3.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most recent</SelectItem>
            <SelectItem value="top">Top voted</SelectItem>
            <SelectItem value="replies">Most replies</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <StickyNote className="h-8 w-8" />
            <p className="text-sm">{query ? "No notes match your search." : "No notes yet. Start the first one."}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((note) => (
            <NoteSummaryCard key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  );
}
