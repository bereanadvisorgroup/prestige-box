"use client";

import { useState } from "react";

import { toast } from "sonner";

import { deleteClientPolicy } from "@/actions/policies";
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
import type { ClientPolicy } from "@/types/crm";

interface DeletePolicyAlertProps {
  policy: ClientPolicy;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeletePolicyAlert({ policy, open, onOpenChange }: DeletePolicyAlertProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    try {
      setIsDeleting(true);
      const result = await deleteClientPolicy(policy.id!);
      if (result.success) {
        toast.success(`Policy record deleted successfully`);
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to delete policy record");
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
            This action cannot be undone. This will permanently delete the policy record for{" "}
            <strong>{policy.policyName}</strong> ({policy.policyNumber}).
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
            className="bg-destructive font-bold text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete Policy Record"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
