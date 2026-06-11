"use client";

import { useState } from "react";

import { toast } from "sonner";

import { deleteMoneyManager } from "@/actions/money-managers";
import { DataTable } from "@/components/data-table/data-table";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import type { MoneyManager } from "@/types/crm";

import { columns } from "./columns";
import { DeleteMoneyManagerAlert } from "./delete-money-manager-alert";

interface MoneyManagersTableProps {
  data: any[];
}

export function MoneyManagersTable({ data }: MoneyManagersTableProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [moneyManagerToDelete, setMoneyManagerToDelete] = useState<MoneyManager | null>(null);

  const handleDelete = async () => {
    if (!moneyManagerToDelete?.id) return;

    setIsDeleting(true);
    try {
      const result = await deleteMoneyManager(moneyManagerToDelete.id);
      if (result.success) {
        toast.success("Money Manager deleted successfully");
        setMoneyManagerToDelete(null);
      } else {
        toast.error(result.error || "Failed to delete money manager");
      }
    } catch (_error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  const table = useDataTableInstance({
    data,
    columns: columns(setMoneyManagerToDelete),
    getRowId: (row) => row.id!,
  });

  return (
    <>
      <DataTable table={table} columns={columns(setMoneyManagerToDelete)} />

      <DeleteMoneyManagerAlert
        isOpen={!!moneyManagerToDelete}
        onClose={() => setMoneyManagerToDelete(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        moneyManagerName={moneyManagerToDelete ? moneyManagerToDelete.firmName : ""}
      />
    </>
  );
}
