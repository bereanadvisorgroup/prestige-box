"use client";

import { useEffect, useMemo, useState } from "react";

import { Plus } from "lucide-react";

import { PersonDialog } from "@/app/(main)/dashboard/crm/people/_components/person-dialog";
import { PersonAvatar } from "@/components/features/crm/person-avatar";
import { Button } from "@/components/ui/button";
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import { formatPersonName } from "@/lib/utils";
import type { Person } from "@/types/crm";

interface PersonSearchSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  people: Person[];
  onPersonCreated: (person: Person) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function PersonSearchSelect({
  value,
  onValueChange,
  people,
  onPersonCreated,
  placeholder = "Search people...",
  disabled = false,
}: PersonSearchSelectProps) {
  const selectedPerson = people.find((p) => p.id === value);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedName = selectedPerson ? formatPersonName(selectedPerson) : "";

  // Sync searchQuery with selected person when value changes
  useEffect(() => {
    setSearchQuery(selectedName);
  }, [selectedName]);

  const filteredPeople = useMemo(() => {
    if (!searchQuery) return people;
    // If query matches the selected person's name exactly, show all people so they can browse
    if (selectedName && searchQuery === selectedName) {
      return people;
    }
    return people.filter((p) => formatPersonName(p).toLowerCase().includes(searchQuery.toLowerCase()));
  }, [people, searchQuery, selectedName]);

  return (
    <Combobox
      value={value || null}
      onValueChange={(val: unknown) => {
        if (typeof val === "string") {
          onValueChange(val);
          const person = people.find((p) => p.id === val);
          if (person) setSearchQuery(formatPersonName(person));
        } else if (val === null) {
          onValueChange("");
          setSearchQuery("");
        }
      }}
      inputValue={searchQuery}
      onInputValueChange={setSearchQuery}
      disabled={disabled}
      onOpenChange={(open) => {
        if (!open) {
          setSearchQuery(selectedName);
        }
      }}
    >
      <ComboboxInput placeholder={placeholder} />
      <ComboboxContent>
        <div className="border-b p-1">
          <PersonDialog
            onPersonCreated={onPersonCreated}
            trigger={
              <Button
                variant="ghost"
                className="h-9 w-full justify-start px-2 font-medium text-primary text-sm hover:bg-primary/5 hover:text-primary"
                type="button"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New Person
              </Button>
            }
          />
        </div>
        <ComboboxList>
          {filteredPeople.map((p) => (
            <ComboboxItem key={p.id} value={p.id!} label={formatPersonName(p)}>
              <div className="flex items-center gap-2">
                <PersonAvatar photoUrl={p.photoUrl} firstName={p.firstName} lastName={p.lastName} size="sm" />
                <div className="flex flex-col">
                  <span className="font-medium">{formatPersonName(p)}</span>
                  <span className="text-muted-foreground text-xs">
                    {p.emails?.find((e) => e.isPrimary)?.address || p.emails?.[0]?.address || "No Email"}
                  </span>
                </div>
              </div>
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
