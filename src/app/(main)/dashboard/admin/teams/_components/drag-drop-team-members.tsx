"use client";

import * as React from "react";

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { GripVertical, Minus, Plus, Shield, User } from "lucide-react";

import type { TeamMemberUser } from "@/actions/teams";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DragDropTeamMembersProps {
  allUsers: TeamMemberUser[];
  selectedUserIds: string[];
  onChange: (userIds: string[]) => void;
}

function UserCard({
  user,
  isInTeam,
  onToggle,
  isDragging,
}: {
  user: TeamMemberUser;
  isInTeam: boolean;
  onToggle: () => void;
  isDragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: user.uid,
    data: { user, isInTeam },
  });

  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email;
  const initials = (user.firstName?.[0] || "") + (user.lastName?.[0] || "") || user.email[0].toUpperCase();

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "group flex select-none items-center justify-between border border-muted bg-card p-2.5 transition-all hover:border-primary/40 hover:shadow-sm",
        isDragging && "border-primary border-dashed opacity-40 shadow-md",
        isInTeam && "border-primary/20 bg-primary/5 dark:bg-primary/10",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <button
          type="button"
          className="shrink-0 cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-muted/60 hover:text-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="Drag to move user"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <Avatar className="h-8 w-8 shrink-0 border border-muted">
          <AvatarImage src={user.photoURL || undefined} alt={fullName} />
          <AvatarFallback className="font-semibold text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-xs leading-tight">{fullName}</p>
          <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge
          variant="outline"
          className={cn(
            "gap-1 px-1.5 py-0 text-[10px] capitalize",
            user.role === "admin"
              ? "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300"
              : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
          )}
        >
          {user.role === "admin" ? <Shield className="h-2.5 w-2.5" /> : <User className="h-2.5 w-2.5" />}
          {user.role}
        </Badge>
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "rounded-full p-1 text-xs transition-colors",
            isInTeam
              ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-950/50 dark:text-red-300"
              : "bg-primary/10 text-primary hover:bg-primary/20",
          )}
          title={isInTeam ? "Remove from Team" : "Add to Team"}
        >
          {isInTeam ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
        </button>
      </div>
    </Card>
  );
}

function ColumnDroppable({
  id,
  title,
  subtitle,
  children,
  isEmpty,
}: {
  id: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  isEmpty: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[300px] flex-col rounded-xl border bg-muted/20 p-3 transition-colors",
        isOver && "border-primary bg-primary/5 ring-2 ring-primary/20",
      )}
    >
      <div className="mb-3 border-b pb-2">
        <h4 className="font-semibold text-sm tracking-tight">{title}</h4>
        <p className="text-muted-foreground text-xs">{subtitle}</p>
      </div>
      <div className="max-h-[360px] flex-1 space-y-2 overflow-y-auto overflow-x-hidden pr-1">
        {isEmpty ? (
          <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed p-4 text-center text-muted-foreground text-xs">
            <User className="mb-1 h-6 w-6 opacity-40" />
            Drag or click users here
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export function DragDropTeamMembers({ allUsers, selectedUserIds, onChange }: DragDropTeamMembersProps) {
  const [activeUser, setActiveUser] = React.useState<TeamMemberUser | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  const selectedUsers = React.useMemo(() => {
    return allUsers.filter((u) => selectedUserIds.includes(u.uid));
  }, [allUsers, selectedUserIds]);

  const availableUsers = React.useMemo(() => {
    return allUsers.filter((u) => !selectedUserIds.includes(u.uid));
  }, [allUsers, selectedUserIds]);

  const handleDragStart = (event: DragStartEvent) => {
    const user = (event.active.data.current as { user: TeamMemberUser })?.user;
    if (user) setActiveUser(user);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveUser(null);

    if (!over) return;

    const userId = active.id as string;
    const targetColumn = over.id as string;

    if (targetColumn === "selected" && !selectedUserIds.includes(userId)) {
      onChange([...selectedUserIds, userId]);
    } else if (targetColumn === "available" && selectedUserIds.includes(userId)) {
      onChange(selectedUserIds.filter((id) => id !== userId));
    }
  };

  const toggleUser = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      onChange(selectedUserIds.filter((id) => id !== userId));
    } else {
      onChange([...selectedUserIds, userId]);
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ColumnDroppable
          id="available"
          title={`Available Users (${availableUsers.length})`}
          subtitle="Advisors & Admins available to add"
          isEmpty={availableUsers.length === 0}
        >
          {availableUsers.map((user) => (
            <UserCard key={user.uid} user={user} isInTeam={false} onToggle={() => toggleUser(user.uid)} />
          ))}
        </ColumnDroppable>

        <ColumnDroppable
          id="selected"
          title={`Team Members (${selectedUsers.length})`}
          subtitle="Users assigned to this team"
          isEmpty={selectedUsers.length === 0}
        >
          {selectedUsers.map((user) => (
            <UserCard key={user.uid} user={user} isInTeam={true} onToggle={() => toggleUser(user.uid)} />
          ))}
        </ColumnDroppable>
      </div>

      <DragOverlay>
        {activeUser ? (
          <UserCard
            user={activeUser}
            isInTeam={selectedUserIds.includes(activeUser.uid)}
            onToggle={() => undefined}
            isDragging
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
