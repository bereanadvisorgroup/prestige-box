"use client";

import { useEffect, useRef } from "react";

import { type Libraries, useJsApiLoader } from "@react-google-maps/api";
import { Search } from "lucide-react";

import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";

const libraries: Libraries = ["places"];

// biome-ignore lint/suspicious/noExplicitAny: Google Maps global object
declare const google: any;

interface AddressAutocompleteProps {
  value?: string;
  onValueChange?: (value: string) => void;
  onAddressSelect: (address: {
    street1: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function AddressAutocomplete({
  value = "",
  onValueChange,
  onAddressSelect,
  placeholder = "Search for an address...",
  autoFocus = false,
}: AddressAutocompleteProps) {
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const onAddressSelectRef = useRef(onAddressSelect);

  // Keep callback ref up to date to avoid stale closures in the listener
  useEffect(() => {
    onAddressSelectRef.current = onAddressSelect;
  }, [onAddressSelect]);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  // Handle autofocus when Google Maps loads and input becomes enabled
  useEffect(() => {
    if (autoFocus && isLoaded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoaded, autoFocus]);

  useEffect(() => {
    if (isLoaded && inputRef.current && !autocompleteRef.current) {
      autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: ["us", "ca"] },
        fields: ["address_components", "formatted_address"],
        types: ["address"],
      });

      autocompleteRef.current!.addListener("place_changed", () => {
        const place = autocompleteRef.current?.getPlace();
        if (place?.address_components) {
          let streetNumber = "";
          let route = "";
          let city = "";
          let state = "";
          let zipCode = "";
          let country = "";

          for (const component of place.address_components) {
            const types = component.types;
            if (types.includes("street_number")) streetNumber = component.short_name;
            if (types.includes("route")) route = component.short_name;
            if (types.includes("locality")) city = component.long_name;
            if (types.includes("administrative_area_level_1")) state = component.short_name;
            if (types.includes("postal_code")) zipCode = component.short_name;
            if (types.includes("country")) country = component.short_name;
          }

          const street1 = `${streetNumber} ${route}`.trim();

          onAddressSelectRef.current({
            street1,
            city,
            state,
            zipCode,
            country,
          });

          // Update the localized controlled state via parent with JUST the street part
          // so we don't dump the full "Anytown, CA 12345, USA" into the Street Address field
          if (onValueChange) {
            onValueChange(street1);
          }
        }
      });
    }
  }, [isLoaded, onValueChange]);

  if (loadError) {
    return <div className="text-destructive text-xs">Error loading Google Maps API. Check your API key.</div>;
  }

  return (
    <div className="relative w-full">
      <InputGroup>
        <InputGroupInput
          ref={inputRef}
          value={value}
          onChange={(e) => onValueChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={!isLoaded}
        />
        <InputGroupAddon align="inline-end">
          {isLoaded ? <Search className="mr-2 h-4 w-4 text-muted-foreground" /> : <Spinner className="mr-2 h-4 w-4" />}
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}
