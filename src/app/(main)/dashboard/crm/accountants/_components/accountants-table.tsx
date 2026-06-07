"use client";

import { useState } from "react";

import { toast } from "sonner";

import { deleteAccountant } from "@/actions/accountants";
import { DataTable } from "@/components/data-table/data-table";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import type { Accountant } from "@/types/crm";

import { columns } from "./columns";
import { DeleteAccountantAlert } from "./delete-accountant-alert";

interface AccountantsTableProps {
  data: any[];
}

export function AccountantsTable({ data }: AccountantsTableProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [accountantToDelete, setAccountantToDelete] = useState<Accountant | null>(null);

  const handleDelete = async () => {
    if (!accountantToDelete?.id) return;

    setIsDeleting(true);
    try {
      const result = await deleteAccountant(accountantToDelete.id);
      if (result.success) {
        toast.success("Accountant deleted successfully");
        setAccountantToDelete(null);
      } else {
        toast.error(result.error || "Failed to delete accountant");
      }
    } catch (_error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  const table = useDataTableInstance({
    data,
    columns: columns(setAccountantToDelete),
    getRowId: (row) => row.id!,
  });

  return (
    <>
      <DataTable table={table} columns={columns(setAccountantToDelete)} />

      <DeleteAccountantAlert
        isOpen={!!accountantToDelete}
        onClose={() => setAccountantToDelete(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        accountantName={
          accountantToDelete
            ? `${(accountantToDelete as any).person?.firstName} ${(accountantToDelete as any).person?.lastName}`
            : ""
        }
      />
    </>
  );
}
