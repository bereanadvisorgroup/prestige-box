"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createAddress, updateAddress } from "@/actions/addresses";
import { AddressAutocomplete } from "@/components/crm/address-autocomplete";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { type Address, AddressSchema } from "@/types/crm";

interface AddressFormProps {
  address?: Address;
}

export function AddressForm({ address }: AddressFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<Address>({
    // biome-ignore lint/suspicious/noExplicitAny: zod resolver type mismatch
    resolver: zodResolver(AddressSchema) as any,
    defaultValues: address || {
      street1: "",
      street2: "",
      city: "",
      state: "",
      zipCode: "",
      country: "USA",
    },
  });

  async function onSubmit(values: Address) {
    try {
      setIsLoading(true);
      const isEditing = !!address?.id;

      const result = isEditing ? await updateAddress(address.id!, values) : await createAddress(values);

      if (result.success) {
        toast.success(isEditing ? "Address updated successfully" : "Address created successfully");
        router.push("/dashboard/crm/addresses");
        router.refresh();
      } else {
        toast.error(result.error || `Failed to ${isEditing ? "update" : "create"} address`);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{address ? "Edit Address" : "Add New Address"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

            <div className="flex justify-end gap-3 pt-6">
              <Button variant="outline" type="button" onClick={() => router.back()} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (address ? "Updating..." : "Creating...") : address ? "Update Address" : "Create Address"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
