"use client";

import { useState } from "react";

import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { resetUserPassword } from "@/actions/users";

const FormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

export function ForgotPasswordForm() {
  const [isLoading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    try {
      setLoading(true);
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const result = await resetUserPassword("", data.email, origin);
      if (!result.success) throw new Error(result.error);
      toast.success("Password reset email sent! Please check your inbox.");
      setIsSent(true);
    } catch (error) {
      console.error("Forgot Password Error:", error);
      toast.error((error as { message: string }).message || "Failed to send reset password email.");
    } finally {
      setLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="space-y-6 text-center">
        <div className="rounded-lg bg-primary/10 p-6 text-primary">
          <p className="font-medium text-lg">Reset Link Sent!</p>
          <p className="mt-2 text-muted-foreground text-sm">
            We have sent a secure link to reset your password. Please check your email inbox and spam folder.
          </p>
        </div>
        <Button asChild className="w-full">
          <Link href="/auth/v1/login">Back to Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="w-full" type="submit" disabled={isLoading}>
          {isLoading ? "Sending..." : "Send Reset Link"}
        </Button>
        <p className="mt-4 text-center text-muted-foreground text-xs">
          Remembered your password?{" "}
          <Link href="/auth/v1/login" className="text-primary hover:underline">
            Login
          </Link>
        </p>
      </form>
    </Form>
  );
}
