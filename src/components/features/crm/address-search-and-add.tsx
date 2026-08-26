"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { type Libraries, useJsApiLoader } from "@react-google-maps/api";
import { Check, Database, Globe, Loader2, MapPin, Plus, Search, X } from "lucide-react";

import { AddressDialog } from "@/app/(main)/dashboard/crm/addresses/_components/address-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import type { Address } from "@/types/crm";

const libraries: Libraries = ["places"];

declare const google: typeof globalThis.google;

interface AddressSearchAndAddProps {
  addresses: Address[];
  selectedAddressIds?: string[];
  onSelectExistingAddress: (address: Address) => void;
  onSelectGooglePlace: (address: Omit<Address, "id" | "createdAt">) => Promise<void> | void;
  onAddressCreated?: (address: Address) => void;
  placeholder?: string;
  className?: string;
}

export function AddressSearchAndAdd({
  addresses,
  selectedAddressIds = [],
  onSelectExistingAddress,
  onSelectGooglePlace,
  onAddressCreated,
  placeholder = "Search existing addresses or start typing a new one...",
  className,
}: AddressSearchAndAddProps) {
  const [query, setQuery] = useState("");
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
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    return addresses.filter((a) => {
      const searchStr =
        `${a.street1} ${a.street2 || ""} ${a.city} ${a.state} ${a.zipCode} ${a.country || ""}`.toLowerCase();
      return searchStr.includes(trimmed);
    });
  }, [addresses, query]);

  // Fetch Google Places predictions with debounce
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2 || !isLoaded || !autocompleteService.current) {
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
  }, [query, isLoaded]);

  const handleSelectDbAddress = (address: Address) => {
    onSelectExistingAddress(address);
    setQuery("");
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

            await onSelectGooglePlace({
              street1,
              city,
              state,
              zipCode,
              country,
            });

            setQuery("");
            setIsOpen(false);
            setGooglePredictions([]);
          }
        } finally {
          setIsResolvingPlace(false);
        }
      },
    );
  };

  const handleManualCreated = (address: Address) => {
    if (onAddressCreated) {
      onAddressCreated(address);
    }
    onSelectExistingAddress(address);
    setQuery("");
    setIsOpen(false);
    setIsManualDialogOpen(false);
  };

  const hasDbMatches = dbMatches.length > 0;
  const hasGoogleMatches = googlePredictions.length > 0;
  const showDropdown = isOpen && query.trim().length > 0;

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <Search className="h-4 w-4 text-muted-foreground" />
        </InputGroupAddon>
        <InputGroupInput
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          disabled={isResolvingPlace}
        />
        <InputGroupAddon align="inline-end">
          {isResolvingPlace || isSearchingGoogle ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : query ? (
            <InputGroupButton
              size="icon-xs"
              variant="ghost"
              type="button"
              onClick={() => {
                setQuery("");
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
        <div className="absolute top-full z-50 mt-1.5 max-h-96 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95">
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
                    const isAlreadyAdded = addr.id ? selectedAddressIds.includes(addr.id) : false;
                    return (
                      <button
                        key={addr.id}
                        type="button"
                        disabled={isAlreadyAdded || isResolvingPlace}
                        onClick={() => handleSelectDbAddress(addr)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-sm px-2.5 py-2 text-left transition-colors",
                          isAlreadyAdded
                            ? "cursor-not-allowed opacity-60 hover:bg-transparent"
                            : "cursor-pointer hover:bg-accent hover:text-accent-foreground",
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
                        {isAlreadyAdded ? (
                          <Badge variant="outline" className="gap-1 border-muted text-[11px] text-muted-foreground">
                            <Check className="h-3 w-3 text-green-500" />
                            Added
                          </Badge>
                        ) : (
                          <span className="font-medium text-primary text-xs opacity-0 transition-opacity group-hover:opacity-100 sm:opacity-100">
                            Select
                          </span>
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
                        Add & Save
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!hasDbMatches && !hasGoogleMatches && !isSearchingGoogle && (
              <div className="px-3 py-6 text-center">
                <p className="text-muted-foreground text-sm">No addresses found for &ldquo;{query}&rdquo;</p>
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

      {/* Controlled Manual Address Dialog */}
      <AddressDialog
        open={isManualDialogOpen}
        onOpenChange={setIsManualDialogOpen}
        onAddressCreated={handleManualCreated}
        trigger={null}
      />
    </div>
  );
}
