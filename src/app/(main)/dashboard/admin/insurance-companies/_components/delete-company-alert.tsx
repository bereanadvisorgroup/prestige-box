"use client";

import { useState } from "react";
import { toast } from "sonner";
import { deleteInsuranceCompany } from "@/actions/insurance-companies";
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
import { InsuranceCompany } from "@/types/crm";

interface DeleteCompanyAlertProps {
  company: InsuranceCompany;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteCompanyAlert({ company, open, onOpenChange }: DeleteCompanyAlertProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    try {
      setIsDeleting(true);
      const result = await deleteInsuranceCompany(company.id!);
      if (result.success) {
        toast.success(`Insurance company deleted successfully`);
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to delete insurance company");
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
            This action cannot be undone. This will permanently delete <strong>{company.name}</strong> from the insurance company list. This might affect client policies linked to this company.
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
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold"
          >
            {isDeleting ? "Deleting..." : "Delete Company"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
