"use client";

import { Plus, User } from "lucide-react";

import { PersonDialog } from "@/app/(main)/dashboard/crm/people/_components/person-dialog";
import { PersonAvatar } from "@/components/crm/person-avatar";
import { Button } from "@/components/ui/button";
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
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
          {people.map((p) => (
            <ComboboxItem key={p.id} value={p.id!} label={`${p.firstName} ${p.lastName}`}>
              <div className="flex items-center gap-2">
                <PersonAvatar photoUrl={p.photoUrl} firstName={p.firstName} lastName={p.lastName} size="sm" />
                <div className="flex flex-col">
                  <span className="font-medium">
                    {p.firstName} {p.lastName}
                  </span>
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
