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
        <div className="p-1 border-b">
          <AddressDialog
            onAddressCreated={onAddressCreated}
            trigger={
              <Button
                variant="ghost"
                className="w-full justify-start h-9 px-2 text-sm font-medium text-primary hover:text-primary hover:bg-primary/5"
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
                <span className="text-xs text-muted-foreground">
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
