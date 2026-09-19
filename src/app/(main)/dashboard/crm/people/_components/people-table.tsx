"use no memo";
"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { Plus, RotateCcw, Search, X } from "lucide-react";

import { getTags } from "@/actions/tags";
import { DataTable } from "@/components/features/data-table/data-table";
import { DataTablePagination } from "@/components/features/data-table/data-table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import type { Person, Tag } from "@/types/crm";

import { columns } from "./columns";
import { DeletePersonAlert } from "./delete-person-alert";

interface PeopleTableProps {
  data: Person[];
}

export function PeopleTable({ data }: PeopleTableProps) {
  const [deletePerson, setDeletePerson] = useState<Person | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [selectedRelation, setSelectedRelation] = useState("all");
  const [selectedTag, setSelectedTag] = useState("all");
  const [systemTags, setSystemTags] = useState<Tag[]>([]);

  useEffect(() => {
    let isMounted = true;
    getTags().then((res) => {
      if (isMounted && res.success && res.tags) {
        setSystemTags(res.tags);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const tagColorMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of systemTags) {
      if (t.name) {
        map.set(t.name.toLowerCase(), t.color || "#64748B");
      }
    }
    return map;
  }, [systemTags]);

  const allAvailableTags = useMemo(() => {
    const tagSet = new Set<string>(systemTags.map((t) => t.name));
    for (const p of data) {
      if (p.tags) {
        for (const t of p.tags) {
          if (t?.trim()) tagSet.add(t.trim());
        }
      }
    }
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
  }, [data, systemTags]);

  const tableColumns = useMemo(() => columns(setDeletePerson, tagColorMap), [tagColorMap]);

  const table = useDataTableInstance({
    data,
    columns: tableColumns,
    getRowId: (row) => row.id!,
    defaultSorting: [{ id: "name", desc: false }],
  });

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    table.getColumn("name")?.setFilterValue(value);
  };

  const handleTagFilterChange = (value: string) => {
    setSelectedTag(value);
    if (value === "all") {
      table.getColumn("tags")?.setFilterValue(undefined);
    } else {
      table.getColumn("tags")?.setFilterValue(value);
    }
  };

  const handleRelationFilterChange = (value: string) => {
    setSelectedRelation(value);
    if (value === "all") {
      table.getColumn("relations")?.setFilterValue(undefined);
    } else {
      table.getColumn("relations")?.setFilterValue(value);
    }
  };

  const hasActiveFilters = Boolean(
    searchValue.trim() ||
      selectedTag !== "all" ||
      selectedRelation !== "all" ||
      (table.getState().columnFilters && table.getState().columnFilters.length > 0),
  );

  const handleClearFilters = () => {
    setSearchValue("");
    setSelectedTag("all");
    setSelectedRelation("all");
    table.resetColumnFilters();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex w-full max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:gap-3">
          <div>
            <h1 className="font-bold text-3xl tracking-tight">People</h1>
          </div>
          <div className="relative w-full max-w-xs sm:mt-2">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name, email, phone, or tag..."
              value={searchValue}
              onChange={(event) => handleSearchChange(event.target.value)}
              className="bg-background pr-9 pl-9"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="absolute top-2.5 right-3 flex h-4 w-4 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="w-full max-w-[160px] sm:mt-2">
            <Select value={selectedTag} onValueChange={handleTagFilterChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Tags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {allAvailableTags.map((tag) => {
                  const color = tagColorMap.get(tag.toLowerCase()) || "#64748B";
                  return (
                    <SelectItem key={tag} value={tag}>
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full border border-black/10 shadow-2xs dark:border-white/20"
                          style={{ backgroundColor: color }}
                        />
                        <span>{tag}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full max-w-[180px] sm:mt-2">
            <Select value={selectedRelation} onValueChange={handleRelationFilterChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Relations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Relations</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="family">Client Family</SelectItem>
                <SelectItem value="company">Company Owner</SelectItem>
                <SelectItem value="firm">Firms & Banks</SelectItem>
                <SelectItem value="household">Households</SelectItem>
                <SelectItem value="manager">Money Managers & Keepers</SelectItem>
                <SelectItem value="insurance">Insurance Vendors</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-9 shrink-0 gap-1.5 px-2.5 text-muted-foreground text-xs hover:text-foreground sm:mt-2"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Clear Filter
            </Button>
          )}
        </div>
        <Button asChild className="shrink-0 font-semibold shadow-sm">
          <Link href="/dashboard/crm/people/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Person
          </Link>
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <DataTable table={table} columns={tableColumns} />
      </div>
      <DataTablePagination table={table} />
      {deletePerson && (
        <DeletePersonAlert
          person={deletePerson}
          open={!!deletePerson}
          onOpenChange={(open: boolean) => !open && setDeletePerson(null)}
        />
      )}
    </div>
  );
}
