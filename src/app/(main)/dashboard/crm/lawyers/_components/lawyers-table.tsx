"use client";

import { useState } from "react";

import { toast } from "sonner";

import { deleteLawyer } from "@/actions/lawyers";
import { DataTable } from "@/components/data-table/data-table";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import type { Lawyer } from "@/types/crm";

import { columns } from "./columns";
import { DeleteLawyerAlert } from "./delete-lawyer-alert";

interface LawyersTableProps {
  data: any[];
}

export function LawyersTable({ data }: LawyersTableProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [lawyerToDelete, setLawyerToDelete] = useState<Lawyer | null>(null);

  const handleDelete = async () => {
    if (!lawyerToDelete?.id) return;

    setIsDeleting(true);
    try {
      const result = await deleteLawyer(lawyerToDelete.id);
      if (result.success) {
        toast.success("Lawyer deleted successfully");
        setLawyerToDelete(null);
      } else {
        toast.error(result.error || "Failed to delete lawyer");
      }
    } catch (_error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  const table = useDataTableInstance({
    data,
    columns: columns(setLawyerToDelete),
    getRowId: (row) => row.id!,
  });

  return (
    <>
      <DataTable table={table} columns={columns(setLawyerToDelete)} />

      <DeleteLawyerAlert
        isOpen={!!lawyerToDelete}
        onClose={() => setLawyerToDelete(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        lawyerName={
          lawyerToDelete
            ? `${(lawyerToDelete as any).person?.firstName} ${(lawyerToDelete as any).person?.lastName}`
            : ""
        }
      />
    </>
  );
}
