"use client";

import * as React from "react";

import { Smile } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// A compact, dependency-free emoji set grouped by category. Each entry carries
// keywords so the search box can match by name without a heavy data package.
const EMOJI_GROUPS: { label: string; emojis: { c: string; k: string }[] }[] = [
  {
    label: "Smileys",
    emojis: [
      { c: "😀", k: "grin happy smile" },
      { c: "😄", k: "happy smile joy" },
      { c: "😁", k: "grin" },
      { c: "😂", k: "laugh tears joy lol" },
      { c: "🤣", k: "rofl laugh" },
      { c: "😊", k: "blush smile" },
      { c: "😉", k: "wink" },
      { c: "😍", k: "love heart eyes" },
      { c: "😘", k: "kiss" },
      { c: "😎", k: "cool sunglasses" },
      { c: "🤔", k: "thinking hmm" },
      { c: "🙂", k: "slight smile" },
      { c: "😅", k: "sweat laugh" },
      { c: "😢", k: "cry sad tear" },
      { c: "😭", k: "sob cry" },
      { c: "😤", k: "frustrated" },
      { c: "😠", k: "angry mad" },
      { c: "😮", k: "wow surprised" },
      { c: "😴", k: "sleep tired" },
      { c: "🙄", k: "eye roll" },
    ],
  },
  {
    label: "Gestures",
    emojis: [
      { c: "👍", k: "thumbs up like yes approve" },
      { c: "👎", k: "thumbs down dislike no" },
      { c: "👏", k: "clap applause" },
      { c: "🙌", k: "raised hands praise" },
      { c: "🙏", k: "pray thanks please" },
      { c: "👌", k: "ok perfect" },
      { c: "🤝", k: "handshake deal" },
      { c: "💪", k: "strong muscle" },
      { c: "✌️", k: "peace victory" },
      { c: "👋", k: "wave hello hi bye" },
      { c: "🤞", k: "fingers crossed luck" },
      { c: "👀", k: "eyes looking watch" },
    ],
  },
  {
    label: "Symbols",
    emojis: [
      { c: "❤️", k: "heart love red" },
      { c: "🧡", k: "heart orange" },
      { c: "💛", k: "heart yellow" },
      { c: "💚", k: "heart green" },
      { c: "💙", k: "heart blue" },
      { c: "💜", k: "heart purple" },
      { c: "🔥", k: "fire hot lit" },
      { c: "⭐", k: "star favorite" },
      { c: "✨", k: "sparkles shiny" },
      { c: "🎉", k: "party tada celebrate" },
      { c: "✅", k: "check done complete yes" },
      { c: "❌", k: "cross no wrong" },
      { c: "⚠️", k: "warning caution" },
      { c: "💡", k: "idea light bulb" },
      { c: "📌", k: "pin important" },
      { c: "🚀", k: "rocket launch ship" },
    ],
  },
  {
    label: "Work",
    emojis: [
      { c: "💼", k: "briefcase work business" },
      { c: "📁", k: "folder file" },
      { c: "📄", k: "document page paper" },
      { c: "📊", k: "chart graph stats" },
      { c: "📈", k: "chart up growth" },
      { c: "📉", k: "chart down loss" },
      { c: "💰", k: "money cash bag" },
      { c: "💵", k: "dollar money cash" },
      { c: "🏦", k: "bank" },
      { c: "📅", k: "calendar date" },
      { c: "⏰", k: "clock time alarm" },
      { c: "📞", k: "phone call" },
      { c: "✉️", k: "email mail envelope" },
      { c: "🔑", k: "key access" },
      { c: "📝", k: "memo note write" },
      { c: "🤖", k: "robot bot ai" },
    ],
  },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  /** Render a custom trigger; defaults to a small smiley button. */
  trigger?: React.ReactNode;
  align?: "start" | "center" | "end";
}

export function EmojiPicker({ onSelect, trigger, align = "start" }: EmojiPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const groups = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return EMOJI_GROUPS;
    return EMOJI_GROUPS.map((g) => ({
      ...g,
      emojis: g.emojis.filter((e) => e.c.includes(q) || e.k.includes(q)),
    })).filter((g) => g.emojis.length > 0);
  }, [query]);

  const handlePick = (c: string) => {
    onSelect(c);
    setOpen(false);
    setQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="Add emoji">
            <Smile className="h-4 w-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent align={align} className="w-72 p-2">
        <Input
          autoFocus
          placeholder="Search emoji…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mb-2 h-8"
        />
        <div className="max-h-60 overflow-y-auto pr-1">
          {groups.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground text-sm">No emoji found</p>
          ) : (
            groups.map((g) => (
              <div key={g.label} className="mb-2">
                <p className="mb-1 px-1 font-medium text-muted-foreground text-xs">{g.label}</p>
                <div className="grid grid-cols-8 gap-0.5">
                  {g.emojis.map((e) => (
                    <button
                      key={e.c}
                      type="button"
                      onClick={() => handlePick(e.c)}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded text-lg",
                        "transition-colors hover:bg-muted",
                      )}
                      aria-label={e.k || e.c}
                    >
                      {e.c}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
