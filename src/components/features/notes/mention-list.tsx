"use client";

import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface MentionUser {
  uid: string;
  name: string;
  photoURL?: string | null;
  role?: string | null;
}

export interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface MentionListProps {
  items: MentionUser[];
  command: (item: { id: string; label: string }) => void;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export const MentionList = React.forwardRef<MentionListRef, MentionListProps>(({ items, command }, ref) => {
  const [selected, setSelected] = React.useState(0);

  // Reset the highlighted row whenever the filtered list changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset is intentionally keyed on items
  React.useEffect(() => setSelected(0), [items]);

  const select = (index: number) => {
    const item = items[index];
    if (item) command({ id: item.uid, label: item.name });
  };

  React.useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowUp") {
        setSelected((s) => (s + items.length - 1) % items.length);
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelected((s) => (s + 1) % items.length);
        return true;
      }
      if (event.key === "Enter") {
        select(selected);
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) {
    return (
      <div className="w-56 rounded-md border bg-popover p-2 text-muted-foreground text-sm shadow-md">
        No teammates found
      </div>
    );
  }

  return (
    <div className="max-h-64 w-56 overflow-y-auto rounded-md border bg-popover p-1 shadow-md">
      {items.map((item, index) => (
        <button
          key={item.uid}
          type="button"
          onClick={() => select(index)}
          onMouseEnter={() => setSelected(index)}
          className={cn(
            "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm",
            index === selected ? "bg-accent text-accent-foreground" : "hover:bg-muted",
          )}
        >
          <Avatar className="h-6 w-6">
            {item.photoURL ? <AvatarImage src={item.photoURL} alt={item.name} /> : null}
            <AvatarFallback className="text-[10px]">{initials(item.name)}</AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1 truncate">{item.name}</span>
          {item.role ? <span className="text-muted-foreground text-xs capitalize">{item.role}</span> : null}
        </button>
      ))}
    </div>
  );
});

MentionList.displayName = "MentionList";
