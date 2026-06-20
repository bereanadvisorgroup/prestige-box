"use client";

import { useRouter } from "next/navigation";

import { Bell, LogOut, User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase.client";
import { getInitials } from "@/lib/utils";
import { useLogger } from 'next-axiom';
import { useAuthStore } from "@/stores/auth.store";

export function AccountSwitcher() {
  const router = useRouter();
  const { user, profile, logout } = useAuthStore();
  const log = useLogger();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      log.info("User logged out", { userId: profile.uid, email: profile.email });
      logout();
      router.push("/auth/v1/login");
    } catch (error) {
      console.error("Error logging out", error);
    }
  };

  if (!profile) return null;

  const photoURL = user?.user_metadata?.avatar_url || profile.photoURL;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="size-9 cursor-pointer rounded-lg">
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
        <div className="flex w-full items-center justify-between gap-2 px-1 py-1.5 outline-none focus:bg-accent/50">
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
            <span className="truncate text-muted-foreground text-xs capitalize">{profile.role}</span>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push("/dashboard/profile")} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-950"
        >
          <LogOut className="mr-2 size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
