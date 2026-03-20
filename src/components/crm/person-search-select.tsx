"use client";

import { Plus, User } from "lucide-react";

import { PersonDialog } from "@/app/(main)/dashboard/crm/people/_components/person-dialog";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
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

  return (
    <Combobox
      value={value || ""}
      onValueChange={(val: any) => {
        if (typeof val === "string") onValueChange(val);
      }}
      disabled={disabled}
    >
      <ComboboxInput
        placeholder={placeholder}
        value={selectedPerson ? `${selectedPerson.firstName} ${selectedPerson.lastName}` : ""}
      />
      <ComboboxContent>
        <div className="p-1 border-b">
          <PersonDialog
            onPersonCreated={onPersonCreated}
            trigger={
              <Button
                variant="ghost"
                className="w-full justify-start h-9 px-2 text-sm font-medium text-primary hover:text-primary hover:bg-primary/5"
                type="button"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New Person
              </Button>
            }
          />
        </div>
        <ComboboxList>
          {people.map((p) => (
            <ComboboxItem key={p.id} value={p.id!} label={`${p.firstName} ${p.lastName}`}>
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="font-medium">
                    {p.firstName} {p.lastName}
                  </span>
                  <span className="text-xs text-muted-foreground">{p.emails?.find(e => e.isPrimary)?.address || p.emails?.[0]?.address || "No Email"}</span>
                </div>
              </div>
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
