"use client";

import { useState } from "react";

import { toast } from "sonner";

import { deleteDisabilityInsuranceCompany } from "@/actions/disability-insurance-companies";
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
import type { DisabilityInsuranceCompany } from "@/types/crm";

interface DeleteCompanyAlertProps {
  company: DisabilityInsuranceCompany;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteCompanyAlert({ company, open, onOpenChange }: DeleteCompanyAlertProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    try {
      setIsDeleting(true);
      const result = await deleteDisabilityInsuranceCompany(company.id!);
      if (result.success) {
        toast.success(`Disability insurance company deleted successfully`);
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to delete disability insurance company");
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
            This action cannot be undone. This will permanently delete <strong>{company.name}</strong> from the
            disability insurance company list.
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
            {isDeleting ? "Deleting..." : "Delete Company"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
