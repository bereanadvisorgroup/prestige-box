"use client";

import { useState } from "react";

import { toast } from "sonner";

import { resetUserPassword } from "@/actions/users";
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

interface ResetPasswordAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  uid: string;
  email: string;
  userName: string;
}

export function ResetPasswordAlert({ open, onOpenChange, uid, email, userName }: ResetPasswordAlertProps) {
  const [isSending, setIsSending] = useState(false);

  async function onReset() {
    try {
      setIsSending(true);
      const origin = window.location.origin;
      const result = await resetUserPassword(uid, email, origin);
      if (result.success) {
        toast.success(`Password reset email sent to ${email}`);
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to send password reset email");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset User Password?</AlertDialogTitle>
          <AlertDialogDescription>
            This will send a secure password reset link to <strong>{userName}</strong> ({email}). They will be able to
            set a new password via the link.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onReset();
            }}
            disabled={isSending}
          >
            {isSending ? "Sending..." : "Send Reset Email"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
