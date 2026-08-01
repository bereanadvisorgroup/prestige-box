"use client";

import { useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface LinkFirmDialogProps {
  entityId: string;
  firmTypeLabel: string;
  availableFirms: { id: string; name: string }[];
  newFirmLink: string;
  onLinkAction: (firmId: string, entityId: string) => Promise<{ success: boolean; error?: string }>;
}

export function LinkFirmDialog({
  entityId,
  firmTypeLabel,
  availableFirms,
  newFirmLink,
  onLinkAction,
}: LinkFirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [selectedFirmId, setSelectedFirmId] = useState<string>("");
  const [isLinking, setIsLinking] = useState(false);
  const router = useRouter();

  const selectedFirm = useMemo(
    () => availableFirms.find((firm) => firm.id === selectedFirmId),
    [availableFirms, selectedFirmId],
  );

  const handleLink = async () => {
    if (!selectedFirmId) return;
    setIsLinking(true);
    try {
      const result = await onLinkAction(selectedFirmId, entityId);
      if (result.success) {
        toast.success(`${firmTypeLabel} linked successfully.`);
        window.dispatchEvent(new CustomEvent("association-change"));
        router.refresh();
        setOpen(false);
        setSelectedFirmId("");
      } else {
        toast.error(result.error || `Failed to link ${firmTypeLabel}.`);
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          <Plus className="mr-1 h-4 w-4" /> Add
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Link {firmTypeLabel}</DialogTitle>
          <DialogDescription>
            Search for an existing {firmTypeLabel.toLowerCase()} to link, or create a new one.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" aria-expanded={comboboxOpen} className="w-full justify-between">
                {selectedFirm ? selectedFirm.name : `Select ${firmTypeLabel.toLowerCase()}...`}
                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[375px] p-0" align="start">
              <Command>
                <CommandInput placeholder={`Search ${firmTypeLabel.toLowerCase()}...`} />
                <CommandList>
                  <CommandEmpty>No {firmTypeLabel.toLowerCase()} found.</CommandEmpty>
                  <CommandGroup>
                    {availableFirms.map((firm) => (
                      <CommandItem
                        key={firm.id}
                        value={firm.name}
                        onSelect={() => {
                          setSelectedFirmId(firm.id);
                          setComboboxOpen(false);
                        }}
                      >
                        {firm.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-2">
            <Button onClick={handleLink} disabled={!selectedFirmId || isLinking} className="flex-1">
              {isLinking ? "Linking..." : "Link Selected"}
            </Button>
          </div>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button variant="outline" asChild className="w-full">
            <Link href={newFirmLink}>Create New {firmTypeLabel}</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
