"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, Phone, Settings } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { updateBusinessContact } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const SettingsSchema = z.object({
  email: z.string().email({ message: "Please enter a valid business email address." }),
  phone: z.string().min(5, { message: "Please enter a valid phone number." }),
});

interface PortalSettingsCardProps {
  initialEmail: string;
  initialPhone: string;
}

export function PortalSettingsCard({ initialEmail, initialPhone }: PortalSettingsCardProps) {
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof SettingsSchema>>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      email: initialEmail,
      phone: initialPhone,
    },
  });

  const onSubmit = async (values: z.infer<typeof SettingsSchema>) => {
    try {
      setIsSaving(true);
      const res = await updateBusinessContact(values.email, values.phone);
      if (!res.success) {
        throw new Error(res.error || "Failed to update settings.");
      }
      toast.success("Portal settings updated successfully.");
    } catch (error) {
      toast.error((error as Error).message || "An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div className="space-y-1.5 pr-4">
          <CardTitle className="font-bold text-xl">Portal Settings</CardTitle>
          <CardDescription>Configure the contact info displayed when a user does not have an account.</CardDescription>
        </div>
        <div className="shrink-0 rounded-xl bg-primary/10 p-3 text-primary">
          <Settings className="h-6 w-6" />
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Support Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="support@company.com" className="pl-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Support Phone Number</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="941-799-3300" className="pl-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full font-semibold" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Settings...
                </>
              ) : (
                "Save Portal Settings"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
