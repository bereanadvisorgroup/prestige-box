"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { createNote } from "@/actions/notes";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { NoteSummary } from "@/types/notes";

interface NotesCardProps {
  clientId: string;
  initialNotes: NoteSummary[];
}

export function NotesCard({ clientId, initialNotes }: NotesCardProps) {
  const router = useRouter();
  const [notes, setNotes] = useState<NoteSummary[]>(initialNotes);
  const [noteBody, setNoteBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteBody.trim()) return;

    try {
      setIsSubmitting(true);
      const text = noteBody.trim();
      const title = text.split("\n")[0].slice(0, 80) || "Quick Note";

      const res = await createNote({
        title,
        body: text,
        associations: [{ entityType: "client", entityId: clientId }],
        attachments: [],
        mentionIds: [],
      });

      if (res.success) {
        toast.success("Note added");
        setNoteBody("");
        router.refresh();
      } else {
        throw new Error(res.error || "Failed to add note");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to add note");
    } finally {
      setIsSubmitting(false);
    }
  };

  const recentNotes = notes.slice(0, 3); // Display top 3 recent notes

  return (
    <div className="flex flex-col h-full min-h-[220px] rounded-lg border border-neutral-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
      <h3 className="text-2xl font-medium tracking-tight text-neutral-800 dark:text-neutral-200 mb-4">Notes:</h3>
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1 max-h-[160px] scrollbar-thin">
        {recentNotes.length > 0 ? (
          recentNotes.map((note) => (
            <Link
              key={note.id}
              href={`/dashboard/crm/notes/${note.id}`}
              className="block border-b border-neutral-100 dark:border-zinc-800 pb-2 last:border-0 last:pb-0 hover:bg-neutral-50 dark:hover:bg-zinc-850 p-1.5 rounded transition-colors group cursor-pointer"
            >
              <div className="flex justify-between items-start gap-2">
                <span className="font-semibold text-xs text-neutral-750 dark:text-neutral-250 truncate group-hover:text-primary transition-colors">
                  {note.title}
                </span>
                <span className="text-[9px] text-muted-foreground whitespace-nowrap shrink-0">
                  {new Date(note.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-0.5 whitespace-pre-wrap break-words">
                {note.excerpt}
              </p>
            </Link>
          ))
        ) : (
          <p className="text-xs text-muted-foreground italic py-2">No recent notes.</p>
        )}
      </div>
      <form onSubmit={handleAddNote} className="flex flex-col gap-2 mt-auto">
        <Textarea
          placeholder="Quick add note..."
          value={noteBody}
          onChange={(e) => setNoteBody(e.target.value)}
          disabled={isSubmitting}
          className="min-h-[50px] text-xs resize-none bg-neutral-50 dark:bg-zinc-950 border-neutral-300 focus-visible:ring-neutral-400 py-1.5 px-2"
        />
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting || !noteBody.trim()}
          className="h-7 text-xs bg-neutral-850 hover:bg-neutral-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900"
        >
          {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
          Add Note
        </Button>
      </form>
    </div>
  );
}
