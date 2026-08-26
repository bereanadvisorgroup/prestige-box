"use client";

import { useEffect, useRef, useState } from "react";

import { type Libraries, useJsApiLoader } from "@react-google-maps/api";
import { Globe, Loader2, MapPin, Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

const libraries: Libraries = ["places"];

declare const google: typeof globalThis.google;

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
  disabled?: boolean;
  className?: string;
}

export function AddressAutocomplete({
  value = "",
  onValueChange,
  onAddressSelect,
  placeholder = "Search for an address...",
  autoFocus = false,
  disabled = false,
  className,
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const onAddressSelectRef = useRef(onAddressSelect);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);

  // Keep callback ref fresh
  useEffect(() => {
    onAddressSelectRef.current = onAddressSelect;
  }, [onAddressSelect]);

  // Sync external value
  useEffect(() => {
    setQuery(value);
  }, [value]);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  // Autofocus when loaded
  useEffect(() => {
    if (autoFocus && isLoaded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoaded, autoFocus]);

  // Initialize services
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

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced prediction fetch
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2 || !isLoaded || !autocompleteService.current) {
      setPredictions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      autocompleteService.current?.getPlacePredictions(
        {
          input: trimmed,
          componentRestrictions: { country: ["us", "ca"] },
          types: ["address"],
        },
        (results, status) => {
          setIsSearching(false);
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            setPredictions(results);
            setHighlightedIndex(-1);
          } else {
            setPredictions([]);
          }
        },
      );
    }, 280);

    return () => clearTimeout(timer);
  }, [query, isLoaded]);

  const handleSelectPrediction = (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesService.current) return;

    setIsResolving(true);
    placesService.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ["address_components", "formatted_address"],
      },
      (place, status) => {
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

            onAddressSelectRef.current({
              street1,
              city,
              state,
              zipCode,
              country,
            });

            setQuery(street1);
            onValueChange?.(street1);
            setIsOpen(false);
            setPredictions([]);
          }
        } finally {
          setIsResolving(false);
        }
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || predictions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < predictions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : predictions.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < predictions.length) {
        handleSelectPrediction(predictions[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const showDropdown = isOpen && query.trim().length >= 2 && predictions.length > 0;

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <InputGroup>
        <InputGroupInput
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onValueChange?.(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length >= 2) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || !isLoaded || isResolving}
        />
        <InputGroupAddon align="inline-end">
          {isResolving || isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : query ? (
            <InputGroupButton
              size="icon-xs"
              variant="ghost"
              type="button"
              onClick={() => {
                setQuery("");
                onValueChange?.("");
                setPredictions([]);
                inputRef.current?.focus();
              }}
              aria-label="Clear input"
            >
              <X className="h-3.5 w-3.5" />
            </InputGroupButton>
          ) : (
            <Search className="mr-1 h-4 w-4 text-muted-foreground" />
          )}
        </InputGroupAddon>
      </InputGroup>

      {loadError && <p className="mt-1 text-destructive text-xs">Error loading Google Maps API. Check your API key.</p>}

      {/* Inline React Suggestions Dropdown */}
      {showDropdown && (
        <div className="fade-in-0 zoom-in-95 absolute top-full z-50 mt-1.5 max-h-60 w-full animate-in overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg">
          <div className="max-h-56 overflow-y-auto p-1 text-sm">
            <div className="flex items-center justify-between px-2.5 py-1 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <Globe className="h-3.5 w-3.5" />
                Google Places Suggestions
              </span>
              <Badge variant="outline" className="h-4 px-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                {predictions.length}
              </Badge>
            </div>
            <div className="mt-1 space-y-0.5">
              {predictions.map((pred, idx) => (
                <button
                  key={pred.place_id}
                  type="button"
                  disabled={isResolving}
                  onClick={() => handleSelectPrediction(pred)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={cn(
                    "flex w-full cursor-pointer items-start gap-2.5 rounded-sm px-2.5 py-2 text-left transition-colors",
                    highlightedIndex === idx
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-foreground text-sm">
                      {pred.structured_formatting.main_text}
                    </div>
                    <div className="truncate text-muted-foreground text-xs">
                      {pred.structured_formatting.secondary_text}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
