"use client";

import { useState } from "react";

import { DataTable } from "@/components/data-table/data-table";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import type { Person } from "@/types/crm";

import { columns } from "./columns";
import { DeletePersonAlert } from "./delete-person-alert";

interface PeopleTableProps {
  data: Person[];
}

export function PeopleTable({ data }: PeopleTableProps) {
  const [deletePerson, setDeletePerson] = useState<Person | null>(null);

  const table = useDataTableInstance({
    data,
    columns: columns(setDeletePerson),
    getRowId: (row) => row.id!,
  });

  return (
    <>
      <DataTable table={table} columns={columns(setDeletePerson)} />
      {deletePerson && (
        <DeletePersonAlert
          person={deletePerson}
          open={!!deletePerson}
          onOpenChange={(open: boolean) => !open && setDeletePerson(null)}
        />
      )}
    </>
  );
}
