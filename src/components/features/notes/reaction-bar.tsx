"use client";

import * as React from "react";

import { SmilePlus } from "lucide-react";

import { toggleReaction } from "@/actions/notes";
import { cn } from "@/lib/utils";
import type { NoteReactionGroup } from "@/types/notes";

import { EmojiPicker } from "./emoji-picker";

interface ReactionBarProps {
  noteId: string;
  reactions: NoteReactionGroup[];
}

export function ReactionBar({ noteId, reactions: initial }: ReactionBarProps) {
  const [reactions, setReactions] = React.useState<NoteReactionGroup[]>(initial);

  const apply = async (emoji: string) => {
    // Optimistic toggle.
    setReactions((prev) => {
      const existing = prev.find((r) => r.emoji === emoji);
      if (existing) {
        const count = existing.count + (existing.reactedByMe ? -1 : 1);
        const reactedByMe = !existing.reactedByMe;
        const next = prev.map((r) => (r.emoji === emoji ? { ...r, count, reactedByMe } : r));
        return next.filter((r) => r.count > 0);
      }
      return [...prev, { emoji, count: 1, reactedByMe: true }];
    });
    await toggleReaction(noteId, emoji);
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      {reactions.map((r) => (
        <button
          key={r.emoji}
          type="button"
          onClick={() => apply(r.emoji)}
          className={cn(
            "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
            r.reactedByMe ? "border-primary/40 bg-primary/10 text-primary" : "hover:bg-muted",
          )}
        >
          <span className="text-sm leading-none">{r.emoji}</span>
          <span className="tabular-nums">{r.count}</span>
        </button>
      ))}
      <EmojiPicker
        onSelect={apply}
        trigger={
          <button
            type="button"
            className="flex items-center rounded-full border border-dashed px-2 py-0.5 text-muted-foreground text-xs transition-colors hover:bg-muted"
            aria-label="Add reaction"
          >
            <SmilePlus className="h-3.5 w-3.5" />
          </button>
        }
      />
    </div>
  );
}
