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
import { cn } from "@/lib/utils";

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
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Command
            className="rounded-lg border shadow-sm overflow-visible"
            shouldFilter={false} // We filter manually
          >
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
                className="border-0 focus:ring-0 shadow-none outline-none h-11 w-full text-sm"
              />
            </div>
            {open && filteredGroups && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95">
                <CommandList className="max-h-[300px] overflow-y-auto p-1">
                  {Object.keys(filteredGroups).length === 0 && (
                    <CommandEmpty className="py-6 text-center text-sm">No entities found.</CommandEmpty>
                  )}
                  {Object.entries(filteredGroups).map(([group, groupNodes], i) => (
                    <React.Fragment key={group}>
                      {i !== 0 && <CommandSeparator className="my-1" />}
                      <CommandGroup heading={group} className="text-xs text-muted-foreground">
                        {groupNodes.map((node) => (
                          <CommandItem
                            key={node.id}
                            value={node.name}
                            onSelect={() => {
                              onNodeFocus(node.id);
                              setSearchQuery("");
                              setOpen(false);
                            }}
                            className="flex flex-col items-start gap-1 cursor-pointer py-2"
                          >
                            <span className="font-medium text-sm text-foreground">{node.name}</span>
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
          <Badge variant="secondary" className="h-11 px-4 flex items-center gap-2 text-sm whitespace-nowrap">
            <span className="text-muted-foreground font-normal">Focused:</span>
            <span className="font-medium">{focusedNode.name}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 ml-1 hover:bg-muted-foreground/20 rounded-full"
              onClick={() => onNodeFocus(null)}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Clear focus</span>
            </Button>
          </Badge>
        )}
      </div>
      {/* Invisible backdrop to close the dropdown when clicking outside */}
      {open && <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setOpen(false)} />}
    </div>
  );
}
