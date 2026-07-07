"use client";

import type * as React from "react";

import { Building2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

interface FirmLogoProps {
  logoUrl?: string | null;
  name?: string;
  className?: string;
  size?: "default" | "sm" | "lg";
  fallbackIcon?: React.ReactNode;
}

export function FirmLogo({ logoUrl, name = "", className, size = "sm", fallbackIcon }: FirmLogoProps) {
  const initials = getInitials(name);

  return (
    <Avatar className={className} size={size}>
      {logoUrl && <AvatarImage src={logoUrl} alt={name || "Firm logo"} className="object-cover" />}
      <AvatarFallback className="bg-primary/5 font-semibold text-primary">
        {initials !== "?" ? initials : fallbackIcon || <Building2 className="h-3.5 w-3.5 text-muted-foreground" />}
      </AvatarFallback>
    </Avatar>
  );
}
