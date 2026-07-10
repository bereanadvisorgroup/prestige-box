"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { Building2, Loader2, User } from "lucide-react";
import { toast } from "sonner";

import { getClients } from "@/actions/clients";
import { getCompanies } from "@/actions/companies";
import { createWorkflowFromTemplate } from "@/actions/workflows";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { WorkflowEntityType } from "@/types/workflows";

interface EntityOption {
  id: string;
  name: string;
  type: WorkflowEntityType;
}

interface StartWorkflowDialogProps {
  isOpen: boolean;
  onClose: () => void;
  templateId: string | null;
  templateName: string;
}

export function StartWorkflowDialog({ isOpen, onClose, templateId, templateName }: StartWorkflowDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [clients, setClients] = useState<EntityOption[]>([]);
  const [companies, setCompanies] = useState<EntityOption[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      try {
        const [clientsResult, companiesResult] = await Promise.all([getClients(), getCompanies()]);
        if (cancelled) return;

        if (clientsResult.success) {
          setClients(
            (clientsResult.clients || []).map((c) => ({
              id: c.id,
              name: `${c.person?.firstName || ""} ${c.person?.lastName || ""}`.trim() || "Unnamed Client",
              type: "client" as const,
            })),
          );
        }
        if (companiesResult.success) {
          setCompanies(
            (companiesResult.companies || []).map((c: { id: string; name: string }) => ({
              id: c.id,
              name: c.name || "Unnamed Company",
              type: "company" as const,
            })),
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const handleSelect = async (entity: EntityOption) => {
    if (!templateId || isStarting) return;

    setIsStarting(true);
    try {
      const result = await createWorkflowFromTemplate(templateId, entity.type, entity.id);
      if (result.success && result.id) {
        toast.success(`Workflow started for ${entity.name}`);
        onClose();
        const segment = entity.type === "client" ? "clients" : "companies";
        router.push(`/dashboard/crm/${segment}/${entity.id}/internal/workflows/${result.id}`);
      } else {
        toast.error(result.error || "Failed to start workflow");
      }
    } catch (_error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start Workflow</DialogTitle>
          <DialogDescription>
            Select the client or company to start <span className="font-semibold">{templateName}</span> for.
          </DialogDescription>
        </DialogHeader>
        {isLoading || isStarting ? (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            {isStarting ? "Starting workflow..." : "Loading clients and companies..."}
          </div>
        ) : (
          <Command className="rounded-md border">
            <CommandInput placeholder="Search clients and companies..." />
            <CommandList className="max-h-72">
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Clients">
                {clients.map((client) => (
                  <CommandItem
                    key={client.id}
                    value={`client-${client.name}-${client.id}`}
                    onSelect={() => handleSelect(client)}
                  >
                    <User className="mr-2 h-4 w-4 text-muted-foreground" />
                    {client.name}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup heading="Companies">
                {companies.map((company) => (
                  <CommandItem
                    key={company.id}
                    value={`company-${company.name}-${company.id}`}
                    onSelect={() => handleSelect(company)}
                  >
                    <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                    {company.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        )}
      </DialogContent>
    </Dialog>
  );
}
