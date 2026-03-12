"use client";

import { useState } from "react";

import { toast } from "sonner";

import { deleteHousehold } from "@/actions/households";
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
import type { Household } from "@/types/crm";

interface DeleteHouseholdAlertProps {
  household: Household;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteHouseholdAlert({ household, open, onOpenChange }: DeleteHouseholdAlertProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    try {
      setIsDeleting(true);
      const result = await deleteHousehold(household.id!);
      if (result.success) {
        toast.success(`Household deleted successfully`);
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to delete household");
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
            This action cannot be undone. This will permanently delete the household <strong>{household.name}</strong>{" "}
            from the CRM records. This will NOT delete the people or the address associated with this household.
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
            {isDeleting ? "Deleting..." : "Delete Household"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
