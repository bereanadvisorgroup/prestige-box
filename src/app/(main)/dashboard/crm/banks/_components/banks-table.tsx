"use client";

import { useState } from "react";

import { toast } from "sonner";

import { deleteBank } from "@/actions/banks";
import { DataTable } from "@/components/data-table/data-table";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import type { Bank } from "@/types/crm";

import { columns } from "./columns";
import { DeleteBankAlert } from "./delete-bank-alert";

interface BanksTableProps {
  data: Bank[];
}

export function BanksTable({ data }: BanksTableProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [bankToDelete, setBankToDelete] = useState<Bank | null>(null);

  const handleDelete = async () => {
    if (!bankToDelete?.id) return;

    setIsDeleting(true);
    try {
      const result = await deleteBank(bankToDelete.id);
      if (result.success) {
        toast.success("Bank deleted successfully");
        setBankToDelete(null);
      } else {
        toast.error(result.error || "Failed to delete bank");
      }
    } catch (_error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  const table = useDataTableInstance({
    data,
    columns: columns(setBankToDelete),
    getRowId: (row) => row.id!,
  });

  return (
    <>
      <DataTable table={table} columns={columns(setBankToDelete)} />

      <DeleteBankAlert
        isOpen={!!bankToDelete}
        onClose={() => setBankToDelete(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        bankName={bankToDelete ? bankToDelete.firmName : ""}
      />
    </>
  );
}
