"use client";
import * as React from "react";

import { useRouter } from "next/navigation";

import { Loader2, Search } from "lucide-react";

import { globalSearch, type SearchResult } from "@/actions/search";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

export function SearchDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  React.useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setResults([]);
      return;
    }
  }, [open]);

  // Debounced search logic
  React.useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      startTransition(async () => {
        const res = await globalSearch(searchQuery);
        if (res.success && res.results) {
          setResults(res.results);
        }
      });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Group results by type
  const groupedResults = React.useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    for (const item of results) {
      if (!groups[item.type]) {
        groups[item.type] = [];
      }
      groups[item.type].push(item);
    }
    return groups;
  }, [results]);

  const handleSelect = (url: string) => {
    setOpen(false);
    router.push(url);
  };

  return (
    <>
      <Button
        variant="link"
        className="!px-0 font-normal text-muted-foreground hover:no-underline"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
        Search
        <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium text-[10px]">
          <span className="text-xs">⌘</span>J
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="relative">
          <CommandInput
            placeholder="Search across all modules (People, Policies, Firms, etc.)"
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          {isPending && (
            <div className="absolute top-3 right-3 flex items-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        <CommandList>
          {searchQuery.trim().length >= 2 && !isPending && results.length === 0 && (
            <CommandEmpty>No results found.</CommandEmpty>
          )}
          {searchQuery.trim().length < 2 && <CommandEmpty>Type at least 2 characters to search...</CommandEmpty>}
          {Object.entries(groupedResults).map(([group, items], i) => (
            <React.Fragment key={group}>
              {i !== 0 && <CommandSeparator />}
              <CommandGroup heading={group}>
                {items.map((item) => (
                  <CommandItem
                    className="!py-2 cursor-pointer"
                    key={item.id}
                    value={`${item.title} ${item.subtitle}`}
                    onSelect={() => handleSelect(item.url)}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{item.title}</span>
                      {item.subtitle && <span className="text-muted-foreground text-xs">{item.subtitle}</span>}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </React.Fragment>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
