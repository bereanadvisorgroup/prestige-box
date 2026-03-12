"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Plus, Search, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { getAddresses } from "@/actions/addresses";
import { createPerson, updatePerson } from "@/actions/people";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { type Address, type Person, PersonSchema } from "@/types/crm";

import { AddressDialog } from "../../addresses/_components/address-dialog";

interface PersonFormProps {
  person?: Person;
}

export function PersonForm({ person }: PersonFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [availableAddresses, setAvailableAddresses] = useState<Address[]>([]);
  const [linkedAddresses, setLinkedAddresses] = useState<Address[]>([]);

  const form = useForm<Person>({
    resolver: zodResolver(PersonSchema),
    defaultValues: person || {
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      mobilePhone: "",
      addressIds: [],
    },
  });

  useEffect(() => {
    async function fetchAddresses() {
      const result = await getAddresses();
      if (result.success && result.addresses) {
        setAvailableAddresses(result.addresses);

        // If editing, find the full address objects for the linked IDs
        if (person?.addressIds?.length) {
          const linked = result.addresses.filter((addr) => person.addressIds.includes(addr.id!));
          setLinkedAddresses(linked);
        }
      }
    }
    fetchAddresses();
  }, [person]);

  const handleLinkAddress = (addressId: string) => {
    const address = availableAddresses.find((a) => a.id === addressId);
    if (address && !form.getValues("addressIds").includes(addressId)) {
      const currentIds = form.getValues("addressIds");
      form.setValue("addressIds", [...currentIds, addressId]);
      setLinkedAddresses([...linkedAddresses, address]);
    }
  };

  const handleUnlinkAddress = (addressId: string) => {
    const currentIds = form.getValues("addressIds");
    form.setValue(
      "addressIds",
      currentIds.filter((id) => id !== addressId),
    );
    setLinkedAddresses(linkedAddresses.filter((a) => a.id !== addressId));
  };

  const handleNewAddressCreated = (address: Address) => {
    setAvailableAddresses([...availableAddresses, address]);
    handleLinkAddress(address.id!);
  };

  async function onSubmit(values: Person) {
    try {
      setIsLoading(true);
      const isEditing = !!person?.id;

      let result;
      if (isEditing) {
        result = await updatePerson(person.id!, values);
      } else {
        result = await createPerson(values);
      }

      if (result.success) {
        toast.success(isEditing ? "Person updated successfully" : "Person created successfully");
        router.push("/dashboard/crm/people");
        router.refresh();
      } else {
        toast.error(result.error || `Failed to ${isEditing ? "update" : "create"} person`);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-sm">
      <CardHeader>
        <CardTitle>{person ? "Edit Person" : "Add New Person"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-sm font-medium border-b pb-2">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="middleName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Middle Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Quincy" {...field} />
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
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="john.doe@example.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mobilePhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="(555) 000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-sm font-medium">Addresses</h3>
                <AddressDialog onAddressCreated={handleNewAddressCreated} />
              </div>

              {linkedAddresses.length > 0 && (
                <div className="space-y-2">
                  {linkedAddresses.map((addr) => (
                    <div key={addr.id} className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div className="text-sm">
                          <p className="font-medium">
                            {addr.street1}
                            {addr.street2 ? `, ${addr.street2}` : ""}
                          </p>
                          <p className="text-muted-foreground">
                            {addr.city}, {addr.state} {addr.zipCode}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={() => handleUnlinkAddress(addr.id!)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <FormLabel>Link Existing Address</FormLabel>
                <div className="flex gap-2">
                  <Combobox
                    onValueChange={(val: any) => {
                      if (typeof val === "string") handleLinkAddress(val);
                    }}
                  >
                    <ComboboxInput placeholder="Search addresses..." />
                    <ComboboxContent>
                      <ComboboxList>
                        {availableAddresses
                          .filter((addr) => !form.getValues("addressIds").includes(addr.id!))
                          .map((addr) => (
                            <ComboboxItem key={addr.id} value={addr.id!}>
                              {addr.street1}, {addr.city}
                            </ComboboxItem>
                          ))}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </div>
                <FormDescription>Search for an existing address or click 'New Address' to create one.</FormDescription>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button variant="outline" type="button" onClick={() => router.back()} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (person ? "Updating..." : "Creating...") : person ? "Update Person" : "Create Person"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
