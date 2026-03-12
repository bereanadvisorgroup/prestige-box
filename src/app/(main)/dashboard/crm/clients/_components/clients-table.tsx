"use client";

import { useState } from "react";
import { Client } from "@/types/crm";
import { DataTable } from "@/components/data-table/data-table";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { columns } from "./columns";
import { DeleteClientAlert } from "./delete-client-alert";

interface ClientsTableProps {
  data: Client[];
}

export function ClientsTable({ data }: ClientsTableProps) {
  const [deleteClient, setDeleteClient] = useState<Client | null>(null);

  const table = useDataTableInstance({
    data,
    columns: columns(setDeleteClient),
    getRowId: (row) => row.id!,
  });

  return (
    <>
      <DataTable table={table} columns={columns(setDeleteClient)} />
      {deleteClient && (
        <DeleteClientAlert
          client={deleteClient}
          open={!!deleteClient}
          onOpenChange={(open: boolean) => !open && setDeleteClient(null)}
        />
      )}
    </>
  );
}
