"use client";

import { useEffect, useMemo, useState } from "react";

import { DeleteAddressAlert } from "@/app/(main)/dashboard/crm/addresses/_components/delete-address-alert";
import { DataTable } from "@/components/data-table/data-table";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import type { Address } from "@/types/crm";

import { columns, type EnrichedAddress } from "./columns";

interface AddressesTableProps {
  data: EnrichedAddress[];
}

export function AddressesTable({ data }: AddressesTableProps) {
  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);
  const [localData, setLocalData] = useState<EnrichedAddress[]>(data);
  const [tableKey, setTableKey] = useState(0);

  // Keep in sync when server data changes (e.g. navigation)
  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const tableColumns = useMemo(() => columns(setAddressToDelete), []);

  const table = useDataTableInstance({
    data: localData,
    columns: tableColumns,
    getRowId: (row) => row.id!,
  });

  const handleDeleted = (id: string) => {
    setLocalData((prev) => prev.filter((item) => item.id !== id));
    setAddressToDelete(null);
    setTableKey((prev) => prev + 1);
  };

  return (
    <>
      <DataTable key={tableKey} table={table} columns={tableColumns} />
      {addressToDelete && (
        <DeleteAddressAlert
          address={addressToDelete}
          open={!!addressToDelete}
          onOpenChange={(open: boolean) => {
            if (!open) setAddressToDelete(null);
          }}
          onDeleted={handleDeleted}
        />
      )}
    </>
  );
}
