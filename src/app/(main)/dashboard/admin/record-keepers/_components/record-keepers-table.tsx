"use client";

import { useState } from "react";

import { toast } from "sonner";

import { deleteRecordKeeper } from "@/actions/record-keepers";
import { DataTable } from "@/components/data-table/data-table";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import type { RecordKeeper } from "@/types/crm";

import { columns } from "./columns";
import { DeleteRecordKeeperAlert } from "./delete-record-keeper-alert";

interface RecordKeepersTableProps {
  data: any[];
}

export function RecordKeepersTable({ data }: RecordKeepersTableProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [recordKeeperToDelete, setRecordKeeperToDelete] = useState<RecordKeeper | null>(null);

  const handleDelete = async () => {
    if (!recordKeeperToDelete?.id) return;

    setIsDeleting(true);
    try {
      const result = await deleteRecordKeeper(recordKeeperToDelete.id);
      if (result.success) {
        toast.success("Record Keeper deleted successfully");
        setRecordKeeperToDelete(null);
      } else {
        toast.error(result.error || "Failed to delete record keeper");
      }
    } catch (_error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  const table = useDataTableInstance({
    data,
    columns: columns(setRecordKeeperToDelete),
    getRowId: (row) => row.id!,
  });

  return (
    <>
      <DataTable table={table} columns={columns(setRecordKeeperToDelete)} />

      <DeleteRecordKeeperAlert
        isOpen={!!recordKeeperToDelete}
        onClose={() => setRecordKeeperToDelete(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        recordKeeperName={recordKeeperToDelete ? recordKeeperToDelete.firmName : ""}
      />
    </>
  );
}
