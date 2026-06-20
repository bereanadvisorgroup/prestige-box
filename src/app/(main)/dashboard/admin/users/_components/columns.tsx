"use client";

import Link from "next/link";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ArrowUpRight, KeyRound, Pencil, Trash2, User } from "lucide-react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { UserProfile } from "@/stores/auth.store";

export const columns = (
  onDelete: (user: UserProfile & { isLinked?: boolean }) => void,
  onReset: (user: UserProfile & { isLinked?: boolean }) => void
): ColumnDef<UserProfile & { isLinked?: boolean; userName?: string }>[] => [
  {
    accessorKey: "userName",
    filterFn: "includesString",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <Link
              href={`/dashboard/admin/users/${user.uid}`}
              className="flex items-center gap-1 font-medium text-primary hover:underline"
            >
              <span>{user.userName}</span>
              <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
            </Link>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
  },
  {
    accessorKey: "role",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      return (
        <Badge variant={role === "admin" ? "default" : "secondary"} className="capitalize">
          {role}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date Created" />,
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as string;
      if (!date) return <span className="text-muted-foreground">-</span>;
      return <span>{format(new Date(date), "MMM d, yyyy")}</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;

      const providers = (user as UserProfile & { providers?: string[] }).providers;
      const isEmailUser = !providers || providers.length === 0 || providers.includes("email");
      const isDeletable = !user.isLinked;

      return (
        <div className="flex items-center justify-end gap-2">
          {isEmailUser && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={() => onReset(user)}
              title="Reset Password"
            >
              <KeyRound className="h-4 w-4" />
            </Button>
          )}
          <Link href={`/dashboard/admin/users/${user.uid}/edit`}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              title="Edit User"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          {isDeletable ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive/80"
              onClick={() => onDelete(user)}
              title="Delete User"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-not-allowed text-muted-foreground/40"
              disabled
              title="You cannot delete your own account"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      );
    },
  },
];
