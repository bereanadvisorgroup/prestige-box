"use client";

import { Plus } from "lucide-react";

import { AddressDialog } from "@/app/(main)/dashboard/crm/addresses/_components/address-dialog";
import { Button } from "@/components/ui/button";
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import type { Address } from "@/types/crm";

interface AddressSearchSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  addresses: Address[];
  onAddressCreated: (address: Address) => void;
  placeholder?: string;
}

export function AddressSearchSelect({
  value,
  onValueChange,
  addresses,
  onAddressCreated,
  placeholder = "Search addresses...",
}: AddressSearchSelectProps) {
  const selectedAddress = addresses.find((a) => a.id === value);

  return (
    <Combobox
      value={value || ""}
      onValueChange={(val: any) => {
        if (typeof val === "string") onValueChange(val);
      }}
    >
      <ComboboxInput
        placeholder={placeholder}
        value={selectedAddress ? `${selectedAddress.street1}, ${selectedAddress.city}` : ""}
      />
      <ComboboxContent>
        <div className="border-b p-1">
          <AddressDialog
            onAddressCreated={onAddressCreated}
            trigger={
              <Button
                variant="ghost"
                className="h-9 w-full justify-start px-2 font-medium text-primary text-sm hover:bg-primary/5 hover:text-primary"
                type="button"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New Address
              </Button>
            }
          />
        </div>
        <ComboboxList>
          {addresses.map((a) => (
            <ComboboxItem key={a.id} value={a.id!} label={`${a.street1}, ${a.city}`}>
              <div className="flex flex-col">
                <span className="font-medium">{a.street1}</span>
                <span className="text-muted-foreground text-xs">
                  {a.city}, {a.state} {a.zipCode}
                </span>
              </div>
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
