"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { FileText } from "lucide-react";
import { toast } from "sonner";

import { updateClient } from "@/actions/clients";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Client } from "@/types/crm";

interface DocumentsButtonProps {
  client: Client;
}

export function DocumentsButton({ client }: DocumentsButtonProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [urlInput, setUrlInput] = useState(client.documentUrl || "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const hasUrl = !!client.documentUrl;

  const handleSave = async () => {
    const trimmed = urlInput.trim();
    if (trimmed !== "") {
      let isValid = false;
      try {
        const parsed = new URL(trimmed);
        isValid = parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch (_) {
        isValid = false;
      }

      if (!isValid) {
        setError("Please enter a valid HTTP or HTTPS URL (e.g., https://example.com)");
        return;
      }
    }

    setIsSaving(true);
    setError(null);
    try {
      const res = await updateClient(client.id!, {
        documentUrl: trimmed === "" ? null : trimmed,
      });

      if (res.success) {
        toast.success("Document URL saved successfully.");
        setDialogOpen(false);
        router.refresh();
      } else {
        setError(res.error || "Failed to update document URL.");
      }
    } catch (_err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLeftClick = (e: React.MouseEvent) => {
    if (!hasUrl) {
      e.preventDefault();
      return;
    }
    window.open(client.documentUrl!, "_blank", "noopener,noreferrer");
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setUrlInput(client.documentUrl || "");
    setError(null);
    setDialogOpen(true);
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-9 gap-2 px-4 transition-all",
                !hasUrl && "cursor-not-allowed border-dashed opacity-50 hover:bg-background hover:text-foreground",
              )}
              onClick={handleLeftClick}
              onContextMenu={handleRightClick}
            >
              <FileText className="h-4 w-4" />
              <span>Documents</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="start" className="max-w-xs text-xs">
            Left Click to navigate to client documetns, Right Click to edit document link
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Document Link</DialogTitle>
            <DialogDescription>
              Enter the URL for the client's documents. Left-clicking the Documents button will open this link in a new
              tab.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="document-url">Document URL</Label>
              <Input
                id="document-url"
                type="text"
                placeholder="https://example.com/folder"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                aria-invalid={!!error}
              />
              {error && <p className="mt-1 text-destructive text-xs">{error}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
