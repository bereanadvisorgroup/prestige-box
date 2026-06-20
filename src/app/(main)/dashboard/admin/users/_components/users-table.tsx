"use no memo";
"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { Plus, Search, X } from "lucide-react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import type { UserProfile } from "@/stores/auth.store";

import { columns } from "./columns";
import { DeleteUserAlert } from "./delete-user-alert";
import { ResetPasswordAlert } from "./reset-password-alert";

interface UsersTableProps {
  data: (UserProfile & { isLinked?: boolean; userName?: string })[];
}

export function UsersTable({ data }: UsersTableProps) {
  const [deleteUser, setDeleteUser] = useState<(UserProfile & { isLinked?: boolean }) | null>(null);
  const [resetUser, setResetUser] = useState<(UserProfile & { isLinked?: boolean }) | null>(null);
  const [searchValue, setSearchValue] = useState("");

  const tableColumns = useMemo(() => columns(setDeleteUser, setResetUser), []);

  const table = useDataTableInstance({
    data,
    columns: tableColumns,
    getRowId: (row) => row.uid,
    defaultSorting: [{ id: "userName", desc: false }],
  });

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    table.getColumn("userName")?.setFilterValue(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex w-full max-w-2xl flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div>
            <h1 className="font-bold text-3xl tracking-tight">Manage Users</h1>
          </div>
          <div className="relative w-full max-w-xs sm:mt-2">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={searchValue}
              onChange={(event) => handleSearchChange(event.target.value)}
              className="bg-background pr-9 pl-9"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="absolute top-2.5 right-3 flex h-4 w-4 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <Button asChild className="shrink-0 font-semibold shadow-sm">
          <Link href="/dashboard/admin/users/new">
            <Plus className="mr-2 h-4 w-4" />
            Add New User
          </Link>
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <DataTable table={table} columns={tableColumns} />
      </div>
      <DataTablePagination table={table} />

      {resetUser && (
        <ResetPasswordAlert
          open={!!resetUser}
          onOpenChange={(open: boolean) => !open && setResetUser(null)}
          uid={resetUser.uid}
          email={resetUser.email || ""}
          userName={`${resetUser.firstName} ${resetUser.lastName}`}
        />
      )}

      {deleteUser && (
        <DeleteUserAlert
          open={!!deleteUser}
          onOpenChange={(open: boolean) => !open && setDeleteUser(null)}
          uid={deleteUser.uid}
          userName={`${deleteUser.firstName} ${deleteUser.lastName}`}
        />
      )}
    </div>
  );
}
