"use client";

import type * as React from "react";

import { User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatFullName, getInitials } from "@/lib/utils";

interface PersonAvatarProps {
  photoUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  goesBy?: string | null;
  className?: string;
  size?: "default" | "sm" | "lg";
  fallbackIcon?: React.ReactNode;
}

export function PersonAvatar({
  photoUrl,
  firstName = "",
  lastName = "",
  goesBy,
  className,
  size = "sm",
  fallbackIcon,
}: PersonAvatarProps) {
  const name = formatFullName(firstName, lastName, null, "", goesBy);
  const initials = getInitials(name);

  return (
    <Avatar className={className} size={size}>
      {photoUrl && <AvatarImage src={photoUrl} alt={name || "Person avatar"} className="object-cover" />}
      <AvatarFallback className="bg-primary/5 font-semibold text-primary">
        {initials !== "?" ? initials : fallbackIcon || <User className="h-3.5 w-3.5 text-muted-foreground" />}
      </AvatarFallback>
    </Avatar>
  );
}
