"use client";

import * as React from "react";

import { Search, X } from "lucide-react";

import type { GraphNode } from "@/actions/relationship-graph";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

interface EntityFocusSearchProps {
  nodes: GraphNode[];
  focusedNodeId: string | null;
  onNodeFocus: (nodeId: string | null) => void;
}

export function EntityFocusSearch({ nodes, focusedNodeId, onNodeFocus }: EntityFocusSearchProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Keyboard shortcut to focus input
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Filter and group nodes based on search query
  const filteredGroups = React.useMemo(() => {
    if (searchQuery.trim().length < 2) return null;

    const query = searchQuery.toLowerCase();
    const filtered = nodes.filter((n) => n.name.toLowerCase().includes(query));

    const groups: Record<string, GraphNode[]> = {};
    for (const node of filtered) {
      if (!groups[node.group]) {
        groups[node.group] = [];
      }
      groups[node.group].push(node);
    }
    return groups;
  }, [nodes, searchQuery]);

  const focusedNode = React.useMemo(() => {
    if (!focusedNodeId) return null;
    return nodes.find((n) => n.id === focusedNodeId);
  }, [nodes, focusedNodeId]);

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Command
            className="overflow-visible rounded-lg border shadow-sm"
            shouldFilter={false} // We filter manually
          >
            {/* biome-ignore lint/a11y/noStaticElementInteractions: layout click container wrapper */}
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: input handles focus/keyboard events */}
            <div className="flex items-center px-3" onClick={() => setOpen(true)}>
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput
                ref={inputRef}
                placeholder="Search entities to focus (/ to focus)"
                value={searchQuery}
                onValueChange={(v) => {
                  setSearchQuery(v);
                  if (v.trim().length >= 2) setOpen(true);
                  else setOpen(false);
                }}
                onFocus={() => {
                  if (searchQuery.trim().length >= 2) setOpen(true);
                }}
                className="h-11 w-full border-0 text-sm shadow-none outline-none focus:ring-0"
              />
            </div>
            {open && filteredGroups && (
              <div className="fade-in-0 zoom-in-95 absolute top-full right-0 left-0 z-50 mt-1 animate-in rounded-md border bg-popover text-popover-foreground shadow-md outline-none">
                <CommandList className="max-h-[300px] overflow-y-auto p-1">
                  {Object.keys(filteredGroups).length === 0 && (
                    <CommandEmpty className="py-6 text-center text-sm">No entities found.</CommandEmpty>
                  )}
                  {Object.entries(filteredGroups).map(([group, groupNodes], i) => (
                    <React.Fragment key={group}>
                      {i !== 0 && <CommandSeparator className="my-1" />}
                      <CommandGroup heading={group} className="text-muted-foreground text-xs">
                        {groupNodes.map((node) => (
                          <CommandItem
                            key={node.id}
                            value={node.name}
                            onSelect={() => {
                              onNodeFocus(node.id);
                              setSearchQuery("");
                              setOpen(false);
                            }}
                            className="flex cursor-pointer flex-col items-start gap-1 py-2"
                          >
                            <span className="font-medium text-foreground text-sm">{node.name}</span>
                            <span className="text-xs opacity-70">{node.entityType}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </React.Fragment>
                  ))}
                </CommandList>
              </div>
            )}
          </Command>
        </div>
        {focusedNode && (
          <Badge variant="secondary" className="flex h-11 items-center gap-2 whitespace-nowrap px-4 text-sm">
            <span className="font-normal text-muted-foreground">Focused:</span>
            <span className="font-medium">{focusedNode.name}</span>
            <Button
              variant="ghost"
              size="icon"
              className="ml-1 h-5 w-5 rounded-full hover:bg-muted-foreground/20"
              onClick={() => onNodeFocus(null)}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Clear focus</span>
            </Button>
          </Badge>
        )}
      </div>
      {/* Invisible backdrop to close the dropdown when clicking outside */}
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 h-full w-full cursor-default border-none bg-transparent outline-none"
          onClick={() => setOpen(false)}
          aria-label="Close search suggestions"
        />
      )}
    </div>
  );
}
