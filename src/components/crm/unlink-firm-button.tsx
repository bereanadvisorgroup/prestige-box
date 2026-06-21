"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

interface UnlinkFirmButtonProps {
  firmId: string;
  clientId: string;
  isLinked?: boolean;
  onUnlinkAction: (firmId: string, clientId: string) => Promise<{ success: boolean; error?: string }>;
}

export function UnlinkFirmButton({ firmId, clientId, isLinked, onUnlinkAction }: UnlinkFirmButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleUnlink = async () => {
    setIsPending(true);
    try {
      const result = await onUnlinkAction(firmId, clientId);
      if (result.success) {
        toast.success("Firm unlinked successfully.");
        window.dispatchEvent(new CustomEvent("association-change"));
        router.refresh();
      } else {
        toast.error(result.error || "Failed to unlink firm.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleUnlink}
      disabled={isLinked || isPending}
      className={`h-8 w-8 ${
        isLinked
          ? "text-muted-foreground/40 cursor-not-allowed"
          : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
      }`}
      title={isLinked ? "Cannot unlink because it is in use." : "Unlink Firm"}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
