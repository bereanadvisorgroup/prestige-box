"use client";

import { useState } from "react";

import Link from "next/link";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ArrowUpRight, Pencil, Trash2, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { UserProfile } from "@/stores/auth.store";

import { DeleteUserAlert } from "./delete-user-alert";

export const columns: ColumnDef<UserProfile>[] = [
  {
    accessorKey: "userName",
    header: "Name",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <Link
              href={`/dashboard/admin/users/${user.uid}`}
              className="font-medium text-primary hover:underline flex items-center gap-1"
            >
              <span>
                {user.firstName} {user.lastName}
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
            </Link>
          </div>
          <span className="text-xs text-muted-foreground pl-6">{user.uid}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
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
    header: "Date Created",
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
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [showDeleteAlert, setShowDeleteAlert] = useState(false);

      return (
        <div className="flex items-center gap-2 justify-end">
          <Link href={`/dashboard/admin/users/${user.uid}/edit`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive/80"
            onClick={() => setShowDeleteAlert(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          <DeleteUserAlert
            open={showDeleteAlert}
            onOpenChange={setShowDeleteAlert}
            uid={user.uid}
            userName={`${user.firstName} ${user.lastName}`}
          />
        </div>
      );
    },
  },
];
