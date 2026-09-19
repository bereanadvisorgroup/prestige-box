"use client";

import * as React from "react";

import { Check, Loader2, X } from "lucide-react";

import { getTags } from "@/actions/tags";
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
  placeholder = "Search tags...",
  disabled = false,
  className,
}: PersonTagInputProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [allTags, setAllTags] = React.useState<Tag[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
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

  const totalOptionsCount = matchingTags.length;

  // Reset highlighted index when query or results change
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();

      if (!inputValue.trim()) return;

      if (highlightedIndex >= 0 && highlightedIndex < matchingTags.length) {
        handleSelectTag(matchingTags[highlightedIndex].name);
        return;
      }

      if (exactTagMatch) {
        handleSelectTag(exactTagMatch.name);
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
      {/* Visual Input Field with Selected Tags */}
      <label
        htmlFor={inputId}
        className={cn(
          "flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
      >
        {value.map((tag) => {
          const matchedTag = allTags.find((t) => t.name.toLowerCase() === tag.toLowerCase());
          const tagColor = matchedTag?.color || "#64748B";
          return (
            <Badge
              key={tag}
              variant="secondary"
              className="gap-1.5 border px-2 py-0.5 font-normal text-xs shadow-2xs"
              style={{
                backgroundColor: `${tagColor}14`,
                borderColor: `${tagColor}40`,
                color: tagColor,
              }}
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: tagColor }} />
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
                  className="ml-0.5 rounded-full p-0.5 opacity-70 transition-opacity hover:bg-black/10 hover:opacity-100 dark:hover:bg-white/10"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          );
        })}

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
          className="min-w-[140px] flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed"
        />
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
              {/* Matching existing tags */}
              {matchingTags.length > 0 ? (
                <div className="space-y-0.5">
                  <div className="px-2 py-1 font-medium text-[11px] text-muted-foreground uppercase tracking-wider">
                    {query ? "Matching Tags" : "Available Tags"}
                  </div>
                  {matchingTags.map((tag, idx) => {
                    const isSelected = value.includes(tag.name);
                    const tagColor = tag.color || "#64748B";
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
                          highlightedIndex === idx ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full border border-black/10 shadow-2xs dark:border-white/20"
                            style={{ backgroundColor: tagColor }}
                          />
                          <span className={cn(isSelected && "font-medium text-primary")}>{tag.name}</span>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-4 text-center text-muted-foreground text-xs">
                  <p>{allTags.length === 0 ? "No tags created yet." : "No matching tags found."}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground/75">
                    Tags are managed in Admin &gt; People Tags.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
