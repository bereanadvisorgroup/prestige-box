"use client";

import { useEffect, useMemo, useState } from "react";

import { MapPin, Plus, Trash2 } from "lucide-react";

import { AddressDialog } from "@/app/(main)/dashboard/crm/addresses/_components/address-dialog";
import { Button } from "@/components/ui/button";
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import type { Address } from "@/types/crm";

interface AddressSearchSelectProps {
  value?: string | null;
  onValueChange: (value: string) => void;
  addresses: Address[];
  onAddressCreated: (address: Address) => void;
  placeholder?: string;
  showDetailsAndMap?: boolean;
}

export function AddressSearchSelect({
  value,
  onValueChange,
  addresses,
  onAddressCreated,
  placeholder = "Search addresses...",
  showDetailsAndMap = true,
}: AddressSearchSelectProps) {
  const selectedAddress = addresses.find((a) => a.id === value);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedLabel = selectedAddress ? `${selectedAddress.street1}, ${selectedAddress.city}` : "";

  // Sync searchQuery with selected address when value changes
  useEffect(() => {
    setSearchQuery(selectedLabel);
  }, [selectedLabel]);

  const filteredAddresses = useMemo(() => {
    if (!searchQuery) return addresses;
    // If query matches the selected address's label exactly, show all so they can browse
    if (selectedLabel && searchQuery === selectedLabel) {
      return addresses;
    }
    return addresses.filter((a) => {
      const searchStr = `${a.street1} ${a.city} ${a.state} ${a.zipCode}`.toLowerCase();
      return searchStr.includes(searchQuery.toLowerCase());
    });
  }, [addresses, searchQuery, selectedLabel]);

  const mapAddressString = useMemo(() => {
    if (!selectedAddress) return "";
    return `${selectedAddress.street1}${
      selectedAddress.street2 ? `, ${selectedAddress.street2}` : ""
    }, ${selectedAddress.city}, ${selectedAddress.state} ${selectedAddress.zipCode}`;
  }, [selectedAddress]);

  return (
    <div className="space-y-4">
      <Combobox
        value={value || null}
        onValueChange={(val: unknown) => {
          if (typeof val === "string") {
            onValueChange(val);
            const addr = addresses.find((a) => a.id === val);
            if (addr) setSearchQuery(`${addr.street1}, ${addr.city}`);
          } else if (val === null) {
            onValueChange("");
            setSearchQuery("");
          }
        }}
        inputValue={searchQuery}
        onInputValueChange={setSearchQuery}
        onOpenChange={(open) => {
          if (!open) {
            setSearchQuery(selectedLabel);
          }
        }}
      >
        <ComboboxInput placeholder={placeholder} />
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
            {filteredAddresses.map((a) => (
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

      {showDetailsAndMap && selectedAddress && (
        <div className="grid grid-cols-1 gap-4 rounded-xl border bg-muted/10 p-4 shadow-sm md:grid-cols-2">
          {/* Left Column: Address Details */}
          <div className="flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <span>Selected Address Details</span>
              </div>
              <div className="space-y-1 pl-6 text-muted-foreground text-sm">
                <p className="font-medium text-foreground">{selectedAddress.street1}</p>
                {selectedAddress.street2 && <p>{selectedAddress.street2}</p>}
                <p>
                  {selectedAddress.city}, {selectedAddress.state} {selectedAddress.zipCode}
                </p>
                <p className="mt-2 font-medium text-muted-foreground/80 text-xs uppercase tracking-wider">
                  {selectedAddress.country || "USA"}
                </p>
              </div>
            </div>

            <div className="pl-6">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 font-semibold text-muted-foreground text-xs hover:bg-destructive/5 hover:text-destructive"
                onClick={() => {
                  onValueChange("");
                  setSearchQuery("");
                }}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Clear Address
              </Button>
            </div>
          </div>

          {/* Right Column: Google Map Embed */}
          <div className="relative h-40 w-full overflow-hidden rounded-lg border bg-background/50 md:h-auto md:min-h-[140px]">
            <iframe
              title={`Google Map showing ${selectedAddress.street1}`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              className="absolute inset-0 h-full w-full"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps?q=${encodeURIComponent(mapAddressString)}&output=embed`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
