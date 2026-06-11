"use client";

import { useState } from "react";

import { toast } from "sonner";

import { deleteActuarialFirm } from "@/actions/actuarial-firms";
import { DataTable } from "@/components/data-table/data-table";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import type { ActuarialFirm } from "@/types/crm";

import { columns } from "./columns";
import { DeleteActuarialFirmAlert } from "./delete-actuarial-firm-alert";

interface ActuarialFirmsTableProps {
  data: any[];
}

export function ActuarialFirmsTable({ data }: ActuarialFirmsTableProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [actuarialFirmToDelete, setActuarialFirmToDelete] = useState<ActuarialFirm | null>(null);

  const handleDelete = async () => {
    if (!actuarialFirmToDelete?.id) return;

    setIsDeleting(true);
    try {
      const result = await deleteActuarialFirm(actuarialFirmToDelete.id);
      if (result.success) {
        toast.success("Actuarial Firm deleted successfully");
        setActuarialFirmToDelete(null);
      } else {
        toast.error(result.error || "Failed to delete actuarial firm");
      }
    } catch (_error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  const table = useDataTableInstance({
    data,
    columns: columns(setActuarialFirmToDelete),
    getRowId: (row) => row.id!,
  });

  return (
    <>
      <DataTable table={table} columns={columns(setActuarialFirmToDelete)} />

      <DeleteActuarialFirmAlert
        isOpen={!!actuarialFirmToDelete}
        onClose={() => setActuarialFirmToDelete(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        actuarialFirmName={actuarialFirmToDelete ? actuarialFirmToDelete.firmName : ""}
      />
    </>
  );
}
