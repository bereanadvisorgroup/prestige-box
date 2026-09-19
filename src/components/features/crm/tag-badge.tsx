import { X } from "lucide-react";

import { cn } from "@/lib/utils";

export interface TagBadgeProps {
  name: string;
  color?: string | null;
  onRemove?: () => void;
  className?: string;
  size?: "sm" | "md";
}

export function TagBadge({ name, color = "#64748B", onRemove, className, size = "sm" }: TagBadgeProps) {
  const effectiveColor = color || "#64748B";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium shadow-2xs transition-colors",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        className,
      )}
      style={{
        backgroundColor: `${effectiveColor}14`,
        borderColor: `${effectiveColor}40`,
        color: effectiveColor,
      }}
    >
      <span
        className={cn("shrink-0 rounded-full", size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2")}
        style={{ backgroundColor: effectiveColor }}
      />
      <span className="max-w-[150px] truncate">{name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onRemove();
          }}
          className="ml-0.5 rounded-full p-0.5 opacity-70 transition-opacity hover:bg-black/10 hover:opacity-100 dark:hover:bg-white/10"
          aria-label={`Remove tag ${name}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
