"use client";

import * as React from "react";
import { Check, Palette } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export const TAG_COLOR_PRESETS = [
  { name: "Slate", hex: "#64748B" },
  { name: "Gray", hex: "#6B7280" },
  { name: "Red", hex: "#EF4444" },
  { name: "Rose", hex: "#F43F5E" },
  { name: "Orange", hex: "#F97316" },
  { name: "Amber", hex: "#F59E0B" },
  { name: "Emerald", hex: "#10B981" },
  { name: "Teal", hex: "#14B8A6" },
  { name: "Cyan", hex: "#06B6D4" },
  { name: "Sky", hex: "#0EA5E9" },
  { name: "Blue", hex: "#3B82F6" },
  { name: "Indigo", hex: "#6366F1" },
  { name: "Violet", hex: "#8B5CF6" },
  { name: "Purple", hex: "#A855F7" },
  { name: "Fuchsia", hex: "#D946EF" },
  { name: "Pink", hex: "#EC4899" },
];

export interface ColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  tagNamePreview?: string;
  className?: string;
}

export function ColorPicker({
  value = "#64748B",
  onChange,
  disabled = false,
  tagNamePreview,
  className,
}: ColorPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [customHex, setCustomHex] = React.useState(value);

  // Sync internal state when prop changes
  React.useEffect(() => {
    setCustomHex(value);
  }, [value]);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let hex = e.target.value;
    if (!hex.startsWith("#")) {
      hex = `#${hex}`;
    }
    setCustomHex(hex);
    // Validate 6-digit or 3-digit hex
    if (/^#[0-9A-Fa-f]{6}$/.test(hex) || /^#[0-9A-Fa-f]{3}$/.test(hex)) {
      onChange(hex);
    }
  };

  const handleSelectPreset = (hex: string) => {
    setCustomHex(hex);
    onChange(hex);
  };

  const effectiveColor = value || "#64748B";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2.5 rounded-md border border-input bg-background px-3 py-2 text-left text-sm shadow-xs transition-colors hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
        >
          <div className="flex items-center gap-2.5 truncate">
            <span
              className="h-4 w-4 shrink-0 rounded-full border border-black/10 shadow-xs dark:border-white/20"
              style={{ backgroundColor: effectiveColor }}
            />
            <span className="font-mono text-xs text-foreground tracking-wider uppercase">
              {effectiveColor}
            </span>
          </div>
          <Palette className="h-4 w-4 shrink-0 text-muted-foreground opacity-60" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-72 space-y-4 p-4 shadow-xl">
        <div className="space-y-1.5">
          <Label className="font-semibold text-foreground text-xs uppercase tracking-wider">
            Palette Swatches
          </Label>
          <div className="grid grid-cols-8 gap-2 pt-1">
            {TAG_COLOR_PRESETS.map((preset) => {
              const isSelected = effectiveColor.toLowerCase() === preset.hex.toLowerCase();
              return (
                <button
                  key={preset.hex}
                  type="button"
                  title={preset.name}
                  onClick={() => handleSelectPreset(preset.hex)}
                  className={cn(
                    "relative flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-black/10 transition-all hover:scale-115 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-white/20",
                    isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                  )}
                  style={{ backgroundColor: preset.hex }}
                >
                  {isSelected && <Check className="h-3 w-3 text-white drop-shadow-sm" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2 border-border/60 border-t pt-3">
          <Label className="font-semibold text-foreground text-xs uppercase tracking-wider">
            Custom Color
          </Label>
          <div className="flex items-center gap-2">
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-input shadow-xs">
              <input
                type="color"
                value={effectiveColor}
                onChange={(e) => {
                  setCustomHex(e.target.value);
                  onChange(e.target.value);
                }}
                className="absolute -inset-2 h-14 w-14 cursor-pointer border-none bg-transparent"
                title="Choose custom color"
              />
            </div>
            <Input
              value={customHex}
              onChange={handleHexChange}
              placeholder="#3B82F6"
              maxLength={7}
              className="h-9 font-mono text-xs uppercase tracking-wider"
            />
          </div>
        </div>

        {/* Live preview */}
        <div className="space-y-1.5 border-border/60 border-t pt-3">
          <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">
            Tag Preview
          </Label>
          <div className="flex items-center gap-2 pt-0.5">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-medium text-xs shadow-xs"
              style={{
                backgroundColor: `${effectiveColor}1A`,
                borderColor: `${effectiveColor}50`,
                color: effectiveColor,
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: effectiveColor }}
              />
              {tagNamePreview?.trim() ? tagNamePreview.trim() : "Sample Tag"}
            </span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
