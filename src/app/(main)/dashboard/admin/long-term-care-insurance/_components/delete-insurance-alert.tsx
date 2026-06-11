"use client";

import { useState } from "react";

import { toast } from "sonner";

import { deleteLongTermCareInsurance } from "@/actions/long-term-care-insurance";
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
import type { LongTermCareInsurance } from "@/types/crm";

interface DeleteInsuranceAlertProps {
  company: LongTermCareInsurance;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteInsuranceAlert({ company, open, onOpenChange }: DeleteInsuranceAlertProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    try {
      setIsDeleting(true);
      const result = await deleteLongTermCareInsurance(company.id!);
      if (result.success) {
        toast.success(`Long term care insurance carrier deleted successfully`);
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to delete long term care insurance carrier");
      }
    } catch (_error) {
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
            This action cannot be undone. This will permanently delete <strong>{company.name}</strong> from the long
            term care insurance carrier list.
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
            className="bg-destructive font-semibold text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete Carrier"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
