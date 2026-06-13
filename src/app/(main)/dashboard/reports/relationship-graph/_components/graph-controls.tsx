"use client";

import { RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

interface GraphControlsProps {
  visibleGroups: Record<string, boolean>;
  onGroupToggle: (group: string, visible: boolean) => void;
  repulsionStrength: number;
  onRepulsionChange: (value: number) => void;
  onResetZoom: () => void;
  groups: string[];
}

export function GraphControls({
  visibleGroups,
  onGroupToggle,
  repulsionStrength,
  onRepulsionChange,
  onResetZoom,
  groups,
}: GraphControlsProps) {
  return (
    <Card className="flex max-h-[80vh] flex-col gap-6 overflow-y-auto bg-background/95 p-4 shadow-md backdrop-blur">
      <div>
        <h3 className="mb-3 font-semibold text-sm">Controls</h3>
        <Button variant="outline" size="sm" className="w-full justify-start" onClick={onResetZoom}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Reset Zoom
        </Button>
      </div>

      <div>
        <h3 className="mb-3 font-semibold text-sm">Repulsion Strength</h3>
        <Slider
          value={[repulsionStrength]}
          min={50}
          max={1000}
          step={10}
          onValueChange={(vals) => onRepulsionChange(vals[0])}
          className="my-4"
        />
      </div>

      <div>
        <h3 className="mb-3 font-semibold text-sm">Visible Entities</h3>
        <div className="flex flex-col gap-3">
          {groups.map((group) => (
            <div key={group} className="flex items-center justify-between">
              <Label htmlFor={`toggle-${group}`} className="cursor-pointer text-xs">
                {group}
              </Label>
              <Switch
                id={`toggle-${group}`}
                checked={visibleGroups[group] ?? true}
                onCheckedChange={(checked) => onGroupToggle(group, checked)}
              />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
