"use client";

import { useState } from "react";

import { toast } from "sonner";

import { generateUserRecoveryLink, resetUserPassword } from "@/actions/users";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ResetPasswordAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  uid: string;
  email: string;
  userName: string;
}

export function ResetPasswordAlert({ open, onOpenChange, uid, email, userName }: ResetPasswordAlertProps) {
  const [isSending, setIsSending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function onReset() {
    try {
      setIsSending(true);
      setErrorMsg(null);
      const origin = window.location.origin;
      const result = await resetUserPassword(uid, email, origin);
      if (result.success) {
        toast.success(`Password reset email sent to ${email}`);
        onOpenChange(false);
      } else {
        setErrorMsg(
          result.error ||
            "Failed to send password reset email. This could be due to unverified SMTP domain configuration.",
        );
      }
    } catch (error) {
      setErrorMsg("An unexpected error occurred while sending the email.");
      console.error(error);
    } finally {
      setIsSending(false);
    }
  }

  async function onGenerateDirectLink() {
    try {
      setIsGenerating(true);
      setErrorMsg(null);
      const origin = window.location.origin;
      const result = await generateUserRecoveryLink(email, origin);
      if (result.success && result.link) {
        setGeneratedLink(result.link);
        toast.success("Recovery link generated successfully!");
      } else {
        setErrorMsg(result.error || "Failed to generate recovery link.");
      }
    } catch (error) {
      setErrorMsg("An unexpected error occurred while generating the link.");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  }

  const copyToClipboard = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setErrorMsg(null);
    setGeneratedLink(null);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Reset User Password?</AlertDialogTitle>
          <AlertDialogDescription>
            {generatedLink ? (
              <span className="mb-4 block text-foreground text-sm">
                The recovery link has been generated. You can copy and send it to the user manually.
              </span>
            ) : (
              <span>
                This will send a secure password reset link to <strong>{userName}</strong> ({email}). They will be able
                to set a new password via the link.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {errorMsg && (
          <div className="rounded-lg bg-destructive/10 p-3 font-medium text-destructive text-sm">
            <p>{errorMsg}</p>
            <p className="mt-2 text-xs opacity-80">
              Note: If the SMTP server (e.g. Resend) is not verified, emails will fail to deliver. You can generate the
              recovery link directly instead.
            </p>
          </div>
        )}

        {generatedLink && (
          <div className="mt-2 flex items-center space-x-2">
            <Input readOnly value={generatedLink} className="flex-1 select-all font-mono text-xs" />
            <Button size="sm" onClick={copyToClipboard} className="shrink-0">
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        )}

        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel onClick={handleClose} disabled={isSending || isGenerating}>
            {generatedLink ? "Done" : "Cancel"}
          </AlertDialogCancel>

          {!generatedLink && (
            <>
              {errorMsg && (
                <Button variant="outline" onClick={onGenerateDirectLink} disabled={isGenerating}>
                  {isGenerating ? "Generating..." : "Generate Link Directly"}
                </Button>
              )}
              {!errorMsg && (
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    onReset();
                  }}
                  disabled={isSending}
                >
                  {isSending ? "Sending..." : "Send Reset Email"}
                </AlertDialogAction>
              )}
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
