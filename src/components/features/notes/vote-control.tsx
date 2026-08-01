"use client";

import * as React from "react";

import { ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

import { castVote } from "@/actions/notes";
import { cn } from "@/lib/utils";

interface VoteControlProps {
  noteId: string;
  score: number;
  myVote: number; // -1 | 0 | 1
}

export function VoteControl({ noteId, score: initialScore, myVote: initialVote }: VoteControlProps) {
  const [score, setScore] = React.useState(initialScore);
  const [myVote, setMyVote] = React.useState(initialVote);
  const [pending, setPending] = React.useState(false);

  const vote = async (value: 1 | -1) => {
    if (pending) return;
    setPending(true);
    // Optimistic: apply locally, then reconcile with the server's authoritative score.
    const prevVote = myVote;
    const prevScore = score;
    const nextVote = prevVote === value ? 0 : value;
    setMyVote(nextVote);
    setScore(prevScore - prevVote + nextVote);

    const res = await castVote(noteId, value);
    if (!res.success) {
      setMyVote(prevVote);
      setScore(prevScore);
      toast.error(res.error || "Vote failed");
    } else {
      setScore(res.score ?? prevScore);
      setMyVote(res.myVote ?? nextVote);
    }
    setPending(false);
  };

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={() => vote(1)}
        aria-label="Upvote"
        className={cn(
          "rounded p-0.5 transition-colors hover:bg-muted",
          myVote === 1 ? "text-emerald-600" : "text-muted-foreground",
        )}
      >
        <ChevronUp className="h-4 w-4" />
      </button>
      <span
        className={cn(
          "min-w-5 text-center font-medium text-xs tabular-nums",
          myVote === 1 ? "text-emerald-600" : myVote === -1 ? "text-rose-600" : "text-foreground",
        )}
      >
        {score}
      </span>
      <button
        type="button"
        onClick={() => vote(-1)}
        aria-label="Downvote"
        className={cn(
          "rounded p-0.5 transition-colors hover:bg-muted",
          myVote === -1 ? "text-rose-600" : "text-muted-foreground",
        )}
      >
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  );
}
