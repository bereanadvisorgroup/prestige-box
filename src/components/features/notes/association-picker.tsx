"use client";

import * as React from "react";

import { Briefcase, Building2, Plus, User, X } from "lucide-react";

import { getClients } from "@/actions/clients";
import { getCompanies } from "@/actions/companies";
import { getPeople } from "@/actions/people";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { NoteAssociation } from "@/types/notes";

interface Option {
  entityType: "client" | "company" | "person";
  entityId: string;
  name: string;
}

interface AssociationPickerProps {
  value: NoteAssociation[];
  onChange: (next: NoteAssociation[]) => void;
}

export function AssociationPicker({ value, onChange }: AssociationPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [options, setOptions] = React.useState<Option[]>([]);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const [clientsRes, companiesRes, peopleRes] = await Promise.all([getClients(), getCompanies(), getPeople()]);
      if (cancelled) return;
      const opts: Option[] = [];
      if (clientsRes.success) {
        for (const c of clientsRes.clients || []) {
          if (c.id) {
            const name = `${c.person?.firstName ?? ""} ${c.person?.lastName ?? ""}`.trim() || "Unnamed client";
            opts.push({ entityType: "client", entityId: c.id, name });
          }
        }
      }
      if (companiesRes.success) {
        for (const c of companiesRes.companies || []) {
          if (c.id) {
            opts.push({ entityType: "company", entityId: c.id, name: c.name || "Unnamed company" });
          }
        }
      }
      if (peopleRes.success) {
        for (const p of peopleRes.people || []) {
          const name = `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || "Unnamed person";
          opts.push({ entityType: "person", entityId: p.id!, name });
        }
      }
      setOptions(opts);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const nameFor = (a: NoteAssociation) =>
    options.find((o) => o.entityType === a.entityType && o.entityId === a.entityId)?.name ?? "…";

  const isSelected = (o: Option) => value.some((a) => a.entityType === o.entityType && a.entityId === o.entityId);

  const toggle = (o: Option) => {
    if (isSelected(o)) {
      onChange(value.filter((a) => !(a.entityType === o.entityType && a.entityId === o.entityId)));
    } else {
      onChange([...value, { entityType: o.entityType, entityId: o.entityId }]);
    }
  };

  const remove = (a: NoteAssociation) =>
    onChange(value.filter((v) => !(v.entityType === a.entityType && v.entityId === a.entityId)));

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {value.map((a) => (
        <Badge key={`${a.entityType}:${a.entityId}`} variant="secondary" className="gap-1">
          {a.entityType === "client" ? (
            <Briefcase className="h-3 w-3" />
          ) : a.entityType === "person" ? (
            <User className="h-3 w-3" />
          ) : (
            <Building2 className="h-3 w-3" />
          )}
          {nameFor(a)}
          <button type="button" onClick={() => remove(a)} aria-label="Remove association">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="h-7 gap-1 border-dashed text-xs">
            <Plus className="h-3.5 w-3.5" />
            Link client, company or person
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-0">
          <Command>
            <CommandInput placeholder="Search clients, companies & people…" />
            <CommandList>
              <CommandEmpty>{loaded ? "Nothing found." : "Loading…"}</CommandEmpty>
              <CommandGroup heading="Clients">
                {options
                  .filter((o) => o.entityType === "client")
                  .map((o) => (
                    <CommandItem key={`client:${o.entityId}`} value={`client ${o.name}`} onSelect={() => toggle(o)}>
                      <Briefcase className="mr-2 h-4 w-4" />
                      <span className="flex-1">{o.name}</span>
                      {isSelected(o) && <span className="text-primary text-xs">✓</span>}
                    </CommandItem>
                  ))}
              </CommandGroup>
              <CommandGroup heading="Companies">
                {options
                  .filter((o) => o.entityType === "company")
                  .map((o) => (
                    <CommandItem key={`company:${o.entityId}`} value={`company ${o.name}`} onSelect={() => toggle(o)}>
                      <Building2 className="mr-2 h-4 w-4" />
                      <span className="flex-1">{o.name}</span>
                      {isSelected(o) && <span className="text-primary text-xs">✓</span>}
                    </CommandItem>
                  ))}
              </CommandGroup>
              <CommandGroup heading="People">
                {options
                  .filter((o) => o.entityType === "person")
                  .map((o) => (
                    <CommandItem key={`person:${o.entityId}`} value={`person ${o.name}`} onSelect={() => toggle(o)}>
                      <User className="mr-2 h-4 w-4" />
                      <span className="flex-1">{o.name}</span>
                      {isSelected(o) && <span className="text-primary text-xs">✓</span>}
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
