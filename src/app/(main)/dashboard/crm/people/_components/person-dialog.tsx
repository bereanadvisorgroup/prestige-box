"use client";

import type * as React from "react";
import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Plus, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createPerson } from "@/actions/people";
import { PersonDuplicateChecker } from "@/components/features/crm/person-duplicate-checker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { type Person, PersonSchema } from "@/types/crm";

interface PersonDialogProps {
  onPersonCreated: (person: Person) => void;
  trigger?: React.ReactNode;
}

export function PersonDialog({ onPersonCreated, trigger }: PersonDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<Person>({
    resolver: zodResolver(PersonSchema) as any,
    mode: "onChange",
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      suffix: "",
      goesBy: "",
      phones: [{ id: crypto.randomUUID(), number: "", type: "Mobile", isPrimary: true }],
      emails: [{ id: crypto.randomUUID(), address: "", type: "Personal", isPrimary: true }],
      addressIds: [],
    },
  });

  // Reset form when dialog opens to ensure a fresh state
  useEffect(() => {
    if (open) {
      form.reset({
        firstName: "",
        middleName: "",
        lastName: "",
        suffix: "",
        goesBy: "",
        phones: [{ id: crypto.randomUUID(), number: "", type: "Mobile", isPrimary: true }],
        emails: [{ id: crypto.randomUUID(), address: "", type: "Personal", isPrimary: true }],
        addressIds: [],
      });
    }
  }, [open, form.reset]);

  async function onSubmit(values: Person) {
    try {
      setIsLoading(true);
      const result = await createPerson(values);

      if (result.success) {
        toast.success("Person record created");
        onPersonCreated({ ...values, id: result.id });
        setOpen(false);
        form.reset();
      } else {
        toast.error(result.error || "Failed to create person record");
      }
    } catch (_error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" type="button">
            <Plus className="mr-2 h-4 w-4" /> New Person
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Quick Add Person
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="middleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Middle Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Quincy" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="suffix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Suffix (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Jr., III" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="goesBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Goes By (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Bob" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <PersonDuplicateChecker firstName={form.watch("firstName")} lastName={form.watch("lastName")} />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="emails.0.address"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="email"
                          placeholder="john.doe@example.com"
                          {...field}
                          value={field.value ?? ""}
                          className={fieldState.isDirty && !fieldState.invalid && field.value ? "pr-10" : ""}
                        />
                        {fieldState.isDirty && !fieldState.invalid && field.value && (
                          <Check className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-green-500" />
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phones.0.number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Phone</FormLabel>
                    <FormControl>
                      <PhoneInput placeholder="555-123-4567" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 border-t pt-6 font-semibold">
              <Button variant="outline" type="button" onClick={() => setOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Person"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
