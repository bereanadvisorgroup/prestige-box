"use client";

import * as React from "react";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { OpportunityPipelineStage } from "@/types/crm";

interface SortableStageItemProps {
  stage: OpportunityPipelineStage;
  index: number;
  onNameChange: (index: number, newName: string) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

function SortableStageItem({ stage, index, onNameChange, onRemove, canRemove }: SortableStageItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stage.id || `temp-${index}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 rounded-lg border bg-card p-3 shadow-sm">
      <div {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground">
        <GripVertical className="h-5 w-5" />
      </div>

      <div className="flex-1 flex items-center gap-2">
        <span className="text-sm font-semibold text-muted-foreground w-6">#{index + 1}</span>
        <Input
          value={stage.name}
          onChange={(e) => onNameChange(index, e.target.value)}
          placeholder="Stage Name"
          className="h-9"
          required
        />
      </div>

      {canRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(index)}
          className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

interface StagesSortableListProps {
  stages: OpportunityPipelineStage[];
  onChange: (stages: OpportunityPipelineStage[]) => void;
}

export function StagesSortableList({ stages, onChange }: StagesSortableListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = stages.findIndex((s, idx) => (s.id || `temp-${idx}`) === active.id);
    const newIndex = stages.findIndex((s, idx) => (s.id || `temp-${idx}`) === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(stages, oldIndex, newIndex).map((s, idx) => ({
        ...s,
        order: idx,
      }));
      onChange(reordered);
    }
  }

  function handleNameChange(index: number, newName: string) {
    const updated = stages.map((s, idx) => (idx === index ? { ...s, name: newName } : s));
    onChange(updated);
  }

  function handleRemove(index: number) {
    const updated = stages
      .filter((_, idx) => idx !== index)
      .map((s, idx) => ({
        ...s,
        order: idx,
      }));
    onChange(updated);
  }

  function handleAdd() {
    const nextOrder = stages.length;
    const newStage: OpportunityPipelineStage = {
      name: "",
      order: nextOrder,
    };
    onChange([...stages, newStage]);
  }

  const itemIds = React.useMemo(() => {
    return stages.map((s, idx) => s.id || `temp-${idx}`);
  }, [stages]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-foreground">Pipeline Stages</h3>
        <p className="text-xs text-muted-foreground">Drag handles to reorder stages.</p>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {stages.map((stage, index) => (
              <SortableStageItem
                key={stage.id || `temp-${index}`}
                stage={stage}
                index={index}
                onNameChange={handleNameChange}
                onRemove={handleRemove}
                canRemove={stages.length > 1} // Must have at least 1 stage
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAdd}
        className="w-full gap-1.5 py-5 border-dashed"
      >
        <Plus className="h-4 w-4" /> Add Stage
      </Button>
    </div>
  );
}
