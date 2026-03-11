"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { BadgeCheck, Bell, CreditCard, LogOut } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { auth } from "@/lib/firebase.client";
import { cn, getInitials } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";

export function AccountSwitcher() {
  const router = useRouter();
  const { user, profile, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      logout();
      router.push("/auth/v1/login");
    } catch (error) {
      console.error("Error logging out", error);
    }
  };

  if (!profile) return null;

  const photoURL = user?.photoURL || profile.photoURL;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="size-9 rounded-lg cursor-pointer">
          <AvatarImage
            src={photoURL || undefined}
            alt={`${profile.firstName} ${profile.lastName}`}
            referrerPolicy="no-referrer"
          />
          <AvatarFallback className="rounded-lg">
            {getInitials(`${profile.firstName} ${profile.lastName}`)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-56 space-y-1 rounded-lg" side="bottom" align="end" sideOffset={4}>
        <div className="flex w-full items-center justify-between gap-2 px-1 py-1.5 focus:bg-accent/50 outline-none">
          <Avatar className="size-9 rounded-lg">
            <AvatarImage
              src={photoURL || undefined}
              alt={`${profile.firstName} ${profile.lastName}`}
              referrerPolicy="no-referrer"
            />
            <AvatarFallback className="rounded-lg">
              {getInitials(`${profile.firstName} ${profile.lastName}`)}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{`${profile.firstName} ${profile.lastName}`}</span>
            <span className="truncate text-xs capitalize text-muted-foreground">{profile.role}</span>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <BadgeCheck />
            Account
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCard />
            Billing
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Bell />
            Notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
        >
          <LogOut className="mr-2 size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
