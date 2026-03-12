"use client";

import { useState } from "react";

import { toast } from "sonner";

import { deleteAddress } from "@/actions/addresses";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Address } from "@/types/crm";

interface DeleteAddressAlertProps {
  address: Address;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAddressAlert({ address, open, onOpenChange }: DeleteAddressAlertProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    try {
      setIsDeleting(true);
      const result = await deleteAddress(address.id!);
      if (result.success) {
        toast.success(`Address deleted successfully`);
        onOpenChange(false);
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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
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
          <AlertDialogAction
            disabled={isDeleting}
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete Address"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
