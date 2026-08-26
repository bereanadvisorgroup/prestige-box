"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { type Libraries, useJsApiLoader } from "@react-google-maps/api";
import { Check, Database, Globe, Loader2, MapPin, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { createAddress } from "@/actions/addresses";
import { AddressDialog } from "@/app/(main)/dashboard/crm/addresses/_components/address-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import type { Address } from "@/types/crm";

const libraries: Libraries = ["places"];

declare const google: typeof globalThis.google;

interface AddressSearchSelectProps {
  value?: string | null;
  onValueChange: (value: string) => void;
  addresses: Address[];
  onAddressCreated?: (address: Address) => void;
  placeholder?: string;
  showDetailsAndMap?: boolean;
  disabled?: boolean;
  className?: string;
}

export function AddressSearchSelect({
  value,
  onValueChange,
  addresses,
  onAddressCreated,
  placeholder = "Search stored addresses or start typing a new one...",
  showDetailsAndMap = true,
  disabled = false,
  className,
}: AddressSearchSelectProps) {
  const selectedAddress = addresses.find((a) => a.id === value);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isResolvingPlace, setIsResolvingPlace] = useState(false);
  const [googlePredictions, setGooglePredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isSearchingGoogle, setIsSearchingGoogle] = useState(false);
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  const selectedLabel = selectedAddress ? `${selectedAddress.street1}, ${selectedAddress.city}` : "";

  // Sync searchQuery with selected address when value changes
  useEffect(() => {
    setSearchQuery(selectedLabel);
  }, [selectedLabel]);

  // Initialize Google Places services once loaded
  useEffect(() => {
    if (isLoaded && typeof window !== "undefined" && window.google?.maps?.places) {
      if (!autocompleteService.current) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
      }
      if (!placesService.current) {
        const dummyElement = document.createElement("div");
        placesService.current = new window.google.maps.places.PlacesService(dummyElement);
      }
    }
  }, [isLoaded]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isManualDialogOpen) return;
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isManualDialogOpen]);

  // Filter existing database addresses
  const dbMatches = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) return addresses;

    // If query matches the selected address's label exactly, show all addresses for easy browsing
    if (selectedLabel && trimmed === selectedLabel.toLowerCase()) {
      return addresses;
    }

    return addresses.filter((a) => {
      const searchStr =
        `${a.street1} ${a.street2 || ""} ${a.city} ${a.state} ${a.zipCode} ${a.country || ""}`.toLowerCase();
      return searchStr.includes(trimmed);
    });
  }, [addresses, searchQuery, selectedLabel]);

  // Fetch Google Places predictions with debounce
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (
      !trimmed ||
      trimmed.length < 2 ||
      (selectedLabel && trimmed === selectedLabel) ||
      !isLoaded ||
      !autocompleteService.current
    ) {
      setGooglePredictions([]);
      setIsSearchingGoogle(false);
      return;
    }

    setIsSearchingGoogle(true);
    const timeoutId = setTimeout(() => {
      autocompleteService.current?.getPlacePredictions(
        {
          input: trimmed,
          componentRestrictions: { country: ["us", "ca"] },
          types: ["address"],
        },
        (predictions, status) => {
          setIsSearchingGoogle(false);
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setGooglePredictions(predictions);
          } else {
            setGooglePredictions([]);
          }
        },
      );
    }, 280);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedLabel, isLoaded]);

  const handleSelectDbAddress = (address: Address) => {
    if (!address.id) return;
    onValueChange(address.id);
    setSearchQuery(`${address.street1}, ${address.city}`);
    setIsOpen(false);
    setGooglePredictions([]);
  };

  const handleSelectGooglePrediction = (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesService.current) return;

    setIsResolvingPlace(true);
    placesService.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ["address_components", "formatted_address"],
      },
      async (place, status) => {
        try {
          if (status === google.maps.places.PlacesServiceStatus.OK && place?.address_components) {
            let streetNumber = "";
            let route = "";
            let city = "";
            let state = "";
            let zipCode = "";
            let country = "USA";

            for (const component of place.address_components) {
              const types = component.types;
              if (types.includes("street_number")) streetNumber = component.short_name;
              if (types.includes("route")) route = component.short_name;
              if (types.includes("locality")) {
                city = component.long_name;
              } else if (!city && types.includes("sublocality")) {
                city = component.long_name;
              } else if (!city && types.includes("postal_town")) {
                city = component.long_name;
              }
              if (types.includes("administrative_area_level_1")) state = component.short_name;
              if (types.includes("postal_code")) zipCode = component.short_name;
              if (types.includes("country")) country = component.short_name;
            }

            const street1 = `${streetNumber} ${route}`.trim() || prediction.structured_formatting.main_text;
            const addressData: Omit<Address, "id" | "createdAt"> = {
              street1,
              city,
              state,
              zipCode,
              country,
            };

            // Check if this address already exists in database
            const existing = addresses.find(
              (a) =>
                a.street1.toLowerCase() === addressData.street1.toLowerCase() &&
                a.city.toLowerCase() === addressData.city.toLowerCase() &&
                a.state.toLowerCase() === addressData.state.toLowerCase() &&
                a.zipCode.toLowerCase() === addressData.zipCode.toLowerCase(),
            );

            if (existing?.id) {
              onValueChange(existing.id);
              setSearchQuery(`${existing.street1}, ${existing.city}`);
              toast.success("Existing address selected");
            } else {
              const result = await createAddress(addressData);
              if (result.success && result.id) {
                const newId = result.id;
                const newAddress: Address = { ...addressData, id: newId };
                if (onAddressCreated) {
                  onAddressCreated(newAddress);
                }
                onValueChange(newId);
                setSearchQuery(`${newAddress.street1}, ${newAddress.city}`);
                toast.success("Address created and selected");
              } else {
                toast.error(result.error || "Failed to save new address");
                return;
              }
            }

            setIsOpen(false);
            setGooglePredictions([]);
          }
        } catch (err) {
          console.error("Error creating address from Google Places:", err);
          toast.error("Failed to process address from Google Places");
        } finally {
          setIsResolvingPlace(false);
        }
      },
    );
  };

  const handleManualCreated = (address: Address) => {
    if (!address.id) return;
    if (onAddressCreated) {
      onAddressCreated(address);
    }
    onValueChange(address.id);
    setSearchQuery(`${address.street1}, ${address.city}`);
    setIsOpen(false);
    setIsManualDialogOpen(false);
    toast.success("Address created and selected");
  };

  const mapAddressString = useMemo(() => {
    if (!selectedAddress) return "";
    return `${selectedAddress.street1}${
      selectedAddress.street2 ? `, ${selectedAddress.street2}` : ""
    }, ${selectedAddress.city}, ${selectedAddress.state} ${selectedAddress.zipCode}`;
  }, [selectedAddress]);

  const hasDbMatches = dbMatches.length > 0;
  const hasGoogleMatches = googlePredictions.length > 0;
  const showDropdown = isOpen;

  return (
    <div ref={containerRef} className={cn("space-y-4", className)}>
      <div className="relative w-full">
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <Search className="h-4 w-4 text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            ref={inputRef}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            disabled={disabled || isResolvingPlace}
          />
          <InputGroupAddon align="inline-end">
            {isResolvingPlace || isSearchingGoogle ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : searchQuery ? (
              <InputGroupButton
                size="icon-xs"
                variant="ghost"
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  onValueChange("");
                  setGooglePredictions([]);
                  inputRef.current?.focus();
                }}
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </InputGroupButton>
            ) : null}
          </InputGroupAddon>
        </InputGroup>

        {/* Dropdown Results */}
        {showDropdown && (
          <div className="fade-in-0 zoom-in-95 absolute top-full z-50 mt-1.5 max-h-96 w-full animate-in overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg">
            <div className="max-h-[340px] overflow-y-auto p-1 text-sm">
              {/* Database Matches Section */}
              {hasDbMatches && (
                <div className="mb-2">
                  <div className="flex items-center justify-between px-2.5 py-1.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 text-primary">
                      <Database className="h-3.5 w-3.5" />
                      Saved in Database
                    </span>
                    <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                      {dbMatches.length}
                    </Badge>
                  </div>
                  <div className="space-y-0.5">
                    {dbMatches.map((addr) => {
                      const isCurrentSelected = addr.id === value;
                      return (
                        <button
                          key={addr.id}
                          type="button"
                          disabled={isResolvingPlace}
                          onClick={() => handleSelectDbAddress(addr)}
                          className={cn(
                            "flex w-full cursor-pointer items-center justify-between rounded-sm px-2.5 py-2 text-left transition-colors hover:bg-accent hover:text-accent-foreground",
                            isCurrentSelected && "bg-accent/60 font-medium",
                          )}
                        >
                          <div className="flex items-start gap-2.5">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <div>
                              <div className="font-medium text-foreground text-sm">
                                {addr.street1}
                                {addr.street2 ? `, ${addr.street2}` : ""}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                {addr.city}, {addr.state} {addr.zipCode}
                              </div>
                            </div>
                          </div>
                          {isCurrentSelected && (
                            <Badge variant="outline" className="gap-1 border-primary/30 text-[11px] text-primary">
                              <Check className="h-3 w-3 text-primary" />
                              Selected
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Google Places Matches Section */}
              {hasGoogleMatches && (
                <div className={cn(hasDbMatches && "border-t pt-2")}>
                  <div className="flex items-center justify-between px-2.5 py-1.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <Globe className="h-3.5 w-3.5" />
                      Google Places Suggestions
                    </span>
                    <Badge variant="outline" className="h-4 px-1.5 text-[10px] text-emerald-600 dark:text-emerald-400">
                      New
                    </Badge>
                  </div>
                  <div className="space-y-0.5">
                    {googlePredictions.map((pred) => (
                      <button
                        key={pred.place_id}
                        type="button"
                        disabled={isResolvingPlace}
                        onClick={() => handleSelectGooglePrediction(pred)}
                        className="flex w-full cursor-pointer items-start justify-between rounded-sm px-2.5 py-2 text-left transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        <div className="flex items-start gap-2.5">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <div>
                            <div className="font-medium text-foreground text-sm">
                              {pred.structured_formatting.main_text}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {pred.structured_formatting.secondary_text}
                            </div>
                          </div>
                        </div>
                        <Badge variant="secondary" className="ml-2 shrink-0 font-normal text-[10px]">
                          Add & Select
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!hasDbMatches && !hasGoogleMatches && !isSearchingGoogle && (
                <div className="px-3 py-6 text-center">
                  <p className="text-muted-foreground text-sm">No addresses found for &ldquo;{searchQuery}&rdquo;</p>
                  {loadError && (
                    <p className="mt-1 text-destructive text-xs">
                      Google Maps API unavailable. You can enter an address manually.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Action Footer */}
            <div className="border-t bg-muted/40 p-1.5">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsManualDialogOpen(true);
                }}
                className="h-8 w-full justify-start px-2 font-medium text-primary text-xs hover:bg-primary/5 hover:text-primary"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Address Manually
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Controlled Manual Address Dialog */}
      <AddressDialog
        open={isManualDialogOpen}
        onOpenChange={setIsManualDialogOpen}
        onAddressCreated={handleManualCreated}
        trigger={null}
      />

      {/* Address Details & Map Embed */}
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
