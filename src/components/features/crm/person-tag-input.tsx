"use client";

import * as React from "react";

import { Check, Loader2, Plus, Tag as TagIcon, X } from "lucide-react";
import { toast } from "sonner";

import { createTag, getTags } from "@/actions/tags";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Tag } from "@/types/crm";

interface PersonTagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function PersonTagInput({
  value = [],
  onChange,
  placeholder = "Add tags...",
  disabled = false,
  className,
}: PersonTagInputProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [allTags, setAllTags] = React.useState<Tag[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState<number>(-1);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Load existing tags from server
  React.useEffect(() => {
    let isMounted = true;
    async function loadTags() {
      setIsLoading(true);
      try {
        const res = await getTags();
        if (isMounted && res.success && res.tags) {
          setAllTags(res.tags);
        }
      } catch (err) {
        console.error("Failed to load tags:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadTags();
    return () => {
      isMounted = false;
    };
  }, []);

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const query = inputValue.trim().toLowerCase();

  // Filter matching tags based on input
  const matchingTags = React.useMemo(() => {
    if (!query) return allTags;
    return allTags.filter((t) => t.name.toLowerCase().includes(query));
  }, [allTags, query]);

  // Check if query exactly matches an existing tag
  const exactTagMatch = React.useMemo(() => {
    if (!query) return null;
    return allTags.find((t) => t.name.toLowerCase() === query) || null;
  }, [allTags, query]);

  const canCreate = query.length > 0 && !exactTagMatch;

  // Total selectable options in the dropdown: "create option" (if canCreate) + matching tags
  const totalOptionsCount = (canCreate ? 1 : 0) + matchingTags.length;

  // Reset highlighted index when query changes
  React.useEffect(() => {
    setHighlightedIndex(totalOptionsCount > 0 ? 0 : -1);
  }, [totalOptionsCount]);

  const handleSelectTag = (tagName: string) => {
    const trimmed = tagName.trim();
    if (!trimmed) return;

    if (!value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInputValue("");
    inputRef.current?.focus();
  };

  const handleRemoveTag = (tagToRemove: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    onChange(value.filter((t) => t !== tagToRemove));
    inputRef.current?.focus();
  };

  const handleCreateAndAdd = async (nameToCreate: string) => {
    const cleanName = nameToCreate.trim().replace(/,/g, "");
    if (!cleanName) return;

    // If tag is already selected, just clear input
    if (value.some((v) => v.toLowerCase() === cleanName.toLowerCase())) {
      setInputValue("");
      return;
    }

    try {
      setIsCreating(true);
      const res = await createTag(cleanName);
      if (res.success && res.tag) {
        const actualName = res.tag.name;
        // Update local available tags list
        setAllTags((prev) => {
          if (prev.some((t) => t.name.toLowerCase() === actualName.toLowerCase())) {
            return prev;
          }
          return [...prev, res.tag as Tag].sort((a, b) => a.name.localeCompare(b.name));
        });

        // Add to selected tags
        if (!value.includes(actualName)) {
          onChange([...value, actualName]);
        }
        setInputValue("");
      } else {
        toast.error(res.error || "Failed to create tag");
      }
    } catch (err) {
      console.error("Error creating tag:", err);
      toast.error("Failed to create tag");
    } finally {
      setIsCreating(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      e.stopPropagation();

      if (!inputValue.trim()) return;

      // Check if user hit Enter on a highlighted option
      if (canCreate && highlightedIndex === 0) {
        handleCreateAndAdd(inputValue);
        return;
      }

      const tagIndex = canCreate ? highlightedIndex - 1 : highlightedIndex;
      if (tagIndex >= 0 && tagIndex < matchingTags.length) {
        handleSelectTag(matchingTags[tagIndex].name);
        return;
      }

      // Fallback: If exact match exists, add it; otherwise create it
      if (exactTagMatch) {
        handleSelectTag(exactTagMatch.name);
      } else {
        handleCreateAndAdd(inputValue);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      if (totalOptionsCount > 0) {
        setHighlightedIndex((prev) => (prev + 1) % totalOptionsCount);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (totalOptionsCount > 0) {
        setHighlightedIndex((prev) => (prev <= 0 ? totalOptionsCount - 1 : prev - 1));
      }
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      const lastTag = value[value.length - 1];
      handleRemoveTag(lastTag);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const inputId = React.useId();

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Visual Input Field with Tags */}
      <label
        htmlFor={inputId}
        className={cn(
          "flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
      >
        {value.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="gap-1 bg-secondary/80 px-2 py-0.5 font-normal text-secondary-foreground text-xs hover:bg-secondary"
          >
            <TagIcon className="h-3 w-3 opacity-60" />
            <span>{tag}</span>
            {!disabled && (
              <button
                type="button"
                aria-label={`Remove tag ${tag}`}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                onClick={(e) => handleRemoveTag(tag, e)}
                className="ml-0.5 rounded-sm p-0.5 opacity-70 transition-opacity hover:bg-muted-foreground/20 hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}

        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : "Add more..."}
          disabled={disabled}
          className="min-w-[120px] flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed"
        />

        {isCreating && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      </label>

      {/* Floating Suggestions Dropdown */}
      {isOpen && !disabled && (
        <div className="fade-in-0 zoom-in-95 absolute top-full left-0 z-50 mt-1 max-h-60 w-full animate-in overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md">
          {isLoading ? (
            <div className="flex items-center justify-center py-4 text-muted-foreground text-xs">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading tags...
            </div>
          ) : (
            <>
              {/* Creatable Tag Option */}
              {canCreate && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleCreateAndAdd(inputValue)}
                  className={cn(
                    "flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-left text-primary text-sm transition-colors",
                    highlightedIndex === 0 ? "bg-accent" : "hover:bg-accent/60",
                  )}
                >
                  <Plus className="mr-2 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    Create tag <strong className="font-semibold">"{inputValue.trim()}"</strong>
                  </span>
                </button>
              )}

              {/* Matching existing tags */}
              {matchingTags.length > 0 ? (
                <div className="space-y-0.5">
                  {canCreate && <div className="my-1 border-border/60 border-t" />}
                  <div className="px-2 py-1 font-medium text-[11px] text-muted-foreground uppercase tracking-wider">
                    {query ? "Matching Tags" : "Available Tags"}
                  </div>
                  {matchingTags.map((tag, idx) => {
                    const itemIndex = canCreate ? idx + 1 : idx;
                    const isSelected = value.includes(tag.name);
                    return (
                      <button
                        key={tag.id || tag.name}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          if (isSelected) {
                            handleRemoveTag(tag.name);
                          } else {
                            handleSelectTag(tag.name);
                          }
                        }}
                        className={cn(
                          "flex w-full cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm transition-colors",
                          highlightedIndex === itemIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <TagIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className={cn(isSelected && "font-medium text-primary")}>{tag.name}</span>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                !canCreate && (
                  <div className="py-4 text-center text-muted-foreground text-xs">
                    {allTags.length === 0 ? "No tags created yet. Type to create one." : "No matching tags."}
                  </div>
                )
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
