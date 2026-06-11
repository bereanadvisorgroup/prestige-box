"use client";

import { useState } from "react";

import { toast } from "sonner";

import { deleteLawFirm } from "@/actions/law-firms";
import { DataTable } from "@/components/data-table/data-table";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import type { LawFirm } from "@/types/crm";

import { columns } from "./columns";
import { DeleteLawFirmAlert } from "./delete-law-firm-alert";

interface LawFirmsTableProps {
  data: any[];
}

export function LawFirmsTable({ data }: LawFirmsTableProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [lawFirmToDelete, setLawFirmToDelete] = useState<LawFirm | null>(null);

  const handleDelete = async () => {
    if (!lawFirmToDelete?.id) return;

    setIsDeleting(true);
    try {
      const result = await deleteLawFirm(lawFirmToDelete.id);
      if (result.success) {
        toast.success("Law Firm deleted successfully");
        setLawFirmToDelete(null);
      } else {
        toast.error(result.error || "Failed to delete law firm");
      }
    } catch (_error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  const table = useDataTableInstance({
    data,
    columns: columns(setLawFirmToDelete),
    getRowId: (row) => row.id!,
  });

  return (
    <>
      <DataTable table={table} columns={columns(setLawFirmToDelete)} />

      <DeleteLawFirmAlert
        isOpen={!!lawFirmToDelete}
        onClose={() => setLawFirmToDelete(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        lawFirmName={lawFirmToDelete ? lawFirmToDelete.firmName : ""}
      />
    </>
  );
}
