"use client";

import type React from "react";

import { Briefcase, Building2, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useEntityDrawerStore } from "@/stores/entity-drawer.store";

export interface EntityAssociationBadgeProps {
  entityType: "client" | "company" | "person";
  entityId: string;
  name: string;
  className?: string;
  variant?: "default" | "secondary" | "outline";
  showIcon?: boolean;
}

export function EntityAssociationBadge({
  entityType,
  entityId,
  name,
  className,
  variant = "outline",
  showIcon = true,
}: EntityAssociationBadgeProps) {
  const openDrawer = useEntityDrawerStore((s) => s.openDrawer);

  const isSupportedEntity = entityType === "client" || entityType === "company";

  const handleClick = (e: React.MouseEvent) => {
    if (!isSupportedEntity) return;
    e.stopPropagation();
    openDrawer(entityType, entityId);
  };

  const getEntityIcon = () => {
    if (!showIcon) return null;
    if (entityType === "client") return <Briefcase className="h-3 w-3 shrink-0" />;
    if (entityType === "company") return <Building2 className="h-3 w-3 shrink-0" />;
    return <User className="h-3 w-3 shrink-0" />;
  };

  const defaultColorStyles =
    variant === "outline"
      ? entityType === "client"
        ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800"
        : entityType === "company"
          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800"
          : "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800"
      : "";

  return (
    <Badge
      variant={variant}
      onClick={handleClick}
      className={cn(
        "gap-1 select-none",
        isSupportedEntity && "cursor-pointer transition-all hover:opacity-85 hover:shadow-xs active:scale-95",
        defaultColorStyles,
        className,
      )}
      title={isSupportedEntity ? `View ${entityType === "client" ? "Client" : "Company"} details` : undefined}
    >
      {getEntityIcon()}
      <span className="truncate">{name}</span>
    </Badge>
  );
}
