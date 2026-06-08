"use client";

import type * as React from "react";
import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createAddress } from "@/actions/addresses";
import { AddressAutocomplete } from "@/components/crm/address-autocomplete";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { type Address, AddressSchema } from "@/types/crm";

interface AddressDialogProps {
  onAddressCreated: (address: Address) => void;
  trigger?: React.ReactNode;
}

export function AddressDialog({ onAddressCreated, trigger }: AddressDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<Address>({
    resolver: zodResolver(AddressSchema) as any,
    defaultValues: {
      street1: "",
      street2: "",
      city: "",
      state: "",
      zipCode: "",
      country: "USA",
    },
  });

  // Reset form when dialog opens to ensure a fresh state
  useEffect(() => {
    if (open) {
      form.reset({
        street1: "",
        street2: "",
        city: "",
        state: "",
        zipCode: "",
        country: "USA",
      });
    }
  }, [open, form.reset]);

  async function onSubmit(values: Address) {
    try {
      setIsLoading(true);
      const result = await createAddress(values);

      if (result.success) {
        toast.success("Address created and linked");
        onAddressCreated({ ...values, id: result.id });
        setOpen(false);
        form.reset();
      } else {
        toast.error(result.error || "Failed to create address");
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
            <Plus className="mr-2 h-4 w-4" /> New Address
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Add New Address</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="street1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address</FormLabel>
                  <FormControl>
                    <AddressAutocomplete
                      value={field.value}
                      onValueChange={field.onChange}
                      onAddressSelect={(address) => {
                        form.setValue("street1", address.street1, { shouldValidate: true });
                        form.setValue("city", address.city, { shouldValidate: true });
                        form.setValue("state", address.state, { shouldValidate: true });
                        form.setValue("zipCode", address.zipCode, { shouldValidate: true });
                        form.setValue("country", address.country, { shouldValidate: true });
                      }}
                      placeholder="Start typing to lookup address..."
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="street2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Suite / Apt (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Apt 4B" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="Anytown" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="CA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zip Code</FormLabel>
                    <FormControl>
                      <Input placeholder="12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input placeholder="USA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" type="button" onClick={() => setOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Address"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
