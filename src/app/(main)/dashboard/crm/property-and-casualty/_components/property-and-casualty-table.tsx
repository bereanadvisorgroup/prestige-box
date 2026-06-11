"use client";

import { useState } from "react";

import { toast } from "sonner";

import { deletePropertyAndCasualtyFirm } from "@/actions/property-and-casualty";
import { DataTable } from "@/components/data-table/data-table";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import type { PropertyAndCasualtyFirm } from "@/types/crm";

import { columns } from "./columns";
import { DeletePropertyAndCasualtyAlert } from "./delete-property-and-casualty-alert";

interface PropertyAndCasualtyTableProps {
  data: any[];
}

export function PropertyAndCasualtyTable({ data }: PropertyAndCasualtyTableProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [firmToDelete, setFirmToDelete] = useState<PropertyAndCasualtyFirm | null>(null);

  const handleDelete = async () => {
    if (!firmToDelete?.id) return;

    setIsDeleting(true);
    try {
      const result = await deletePropertyAndCasualtyFirm(firmToDelete.id);
      if (result.success) {
        toast.success("Property And Casualty Firm deleted successfully");
        setFirmToDelete(null);
      } else {
        toast.error(result.error || "Failed to delete Property And Casualty Firm");
      }
    } catch (_error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  const table = useDataTableInstance({
    data,
    columns: columns(setFirmToDelete),
    getRowId: (row) => row.id!,
  });

  return (
    <>
      <DataTable table={table} columns={columns(setFirmToDelete)} />

      <DeletePropertyAndCasualtyAlert
        isOpen={!!firmToDelete}
        onClose={() => setFirmToDelete(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        firmName={firmToDelete ? firmToDelete.firmName : ""}
      />
    </>
  );
}
