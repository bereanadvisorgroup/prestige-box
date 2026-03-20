"use client";

import { useState } from "react";

import { toast } from "sonner";

import { deleteAddress } from "@/actions/addresses";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { Address } from "@/types/crm";

interface DeleteAddressAlertProps {
  address: Address;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: (id: string) => void;
}

export function DeleteAddressAlert({ address, open, onOpenChange, onDeleted }: DeleteAddressAlertProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    try {
      setIsDeleting(true);
      const result = await deleteAddress(address.id!);
      if (result.success) {
        toast.success("Address deleted successfully");
        if (onDeleted) {
          onDeleted(address.id!);
        } else {
          onOpenChange(false);
        }
      } else {
        toast.error(result.error || "Failed to delete address. Ensure no people are linked to it.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(newOpen) => {
      if (!isDeleting) onOpenChange(newOpen);
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the address{" "}
            <strong>
              {address.street1}, {address.city}
            </strong>{" "}
            from the CRM records. You can only delete an address if no people are currently linked to it.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <Button
            disabled={isDeleting}
            onClick={handleDelete}
            variant="destructive"
          >
            {isDeleting ? "Deleting..." : "Delete Address"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
