"use client";

import { useState } from "react";
import { Address } from "@/types/crm";
import { DataTable } from "@/components/data-table/data-table";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { columns } from "./columns";
import { DeleteAddressAlert } from "@/app/(main)/dashboard/crm/addresses/_components/delete-address-alert";

interface AddressesTableProps {
  data: Address[];
}

export function AddressesTable({ data }: AddressesTableProps) {
  const [deleteAddress, setDeleteAddress] = useState<Address | null>(null);

  const table = useDataTableInstance({
    data,
    columns: columns(setDeleteAddress),
    getRowId: (row) => row.id!,
  });

  return (
    <>
      <DataTable table={table} columns={columns(setDeleteAddress)} />
      {deleteAddress && (
        <DeleteAddressAlert
          address={deleteAddress}
          open={!!deleteAddress}
          onOpenChange={(open: boolean) => !open && setDeleteAddress(null)}
        />
      )}
    </>
  );
}
