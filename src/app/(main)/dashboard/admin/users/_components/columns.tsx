"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { MoreHorizontal, SquarePen, Trash2 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
          <span className="font-medium">
            {user.firstName} {user.lastName}
          </span>
          <span className="text-xs text-muted-foreground">{user.uid}</span>
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
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/admin/users/${user.uid}/edit`}>
                  <SquarePen className="mr-2 h-4 w-4" />
                  Edit User
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDeleteAlert(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DeleteUserAlert
            open={showDeleteAlert}
            onOpenChange={setShowDeleteAlert}
            uid={user.uid}
            userName={`${user.firstName} ${user.lastName}`}
          />
        </>
      );
    },
  },
];
