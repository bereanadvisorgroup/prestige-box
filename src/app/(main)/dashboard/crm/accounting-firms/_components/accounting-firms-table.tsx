"use client";

import { useState } from "react";

import { toast } from "sonner";

import { deleteAccountingFirm } from "@/actions/accounting-firms";
import { DataTable } from "@/components/data-table/data-table";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import type { AccountingFirm } from "@/types/crm";

import { columns } from "./columns";
import { DeleteAccountingFirmAlert } from "./delete-accounting-firm-alert";

interface AccountingFirmsTableProps {
  data: any[];
}

export function AccountingFirmsTable({ data }: AccountingFirmsTableProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [accountingFirmToDelete, setAccountingFirmToDelete] = useState<AccountingFirm | null>(null);

  const handleDelete = async () => {
    if (!accountingFirmToDelete?.id) return;

    setIsDeleting(true);
    try {
      const result = await deleteAccountingFirm(accountingFirmToDelete.id);
      if (result.success) {
        toast.success("Accounting Firm deleted successfully");
        setAccountingFirmToDelete(null);
      } else {
        toast.error(result.error || "Failed to delete accounting firm");
      }
    } catch (_error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  const table = useDataTableInstance({
    data,
    columns: columns(setAccountingFirmToDelete),
    getRowId: (row) => row.id!,
  });

  return (
    <>
      <DataTable table={table} columns={columns(setAccountingFirmToDelete)} />

      <DeleteAccountingFirmAlert
        isOpen={!!accountingFirmToDelete}
        onClose={() => setAccountingFirmToDelete(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        firmName={accountingFirmToDelete?.firmName || ""}
      />
    </>
  );
}
