"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Trash2, User, Users } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

import { getAddresses } from "@/actions/addresses";
import { createHousehold, updateHousehold } from "@/actions/households";
import { getPeople } from "@/actions/people";
import { AddressSearchSelect } from "@/components/crm/address-search-select";
import { PersonSearchSelect } from "@/components/crm/person-search-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Address, type Household, HouseholdSchema, type Person } from "@/types/crm";

interface HouseholdFormProps {
  household?: Household;
}

export function HouseholdForm({ household }: HouseholdFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [availableAddresses, setAvailableAddresses] = useState<Address[]>([]);
  const [availablePeople, setAvailablePeople] = useState<Person[]>([]);

  const form = useForm<Household>({
    resolver: zodResolver(HouseholdSchema),
    defaultValues: household || {
      name: "",
      addressId: "",
      memberIds: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "memberIds",
  });

  useEffect(() => {
    async function fetchData() {
      const [addrResult, peopleResult] = await Promise.all([getAddresses(), getPeople()]);

      if (addrResult.success && addrResult.addresses) {
        setAvailableAddresses(addrResult.addresses);
      }
      if (peopleResult.success && peopleResult.people) {
        setAvailablePeople(peopleResult.people);
      }
    }
    fetchData();
  }, []);

  const handleAddMember = (personId: string) => {
    if (!form.getValues("memberIds").some((m) => m.personId === personId)) {
      append({ personId, role: "home_owner" });
    } else {
      toast.error("This person is already a member of this household");
    }
  };

  async function onSubmit(values: Household) {
    try {
      setIsLoading(true);
      const isEditing = !!household?.id;

      let result;
      if (isEditing) {
        result = await updateHousehold(household.id!, values);
      } else {
        result = await createHousehold(values);
      }

      if (result.success) {
        toast.success(isEditing ? "Household updated successfully" : "Household created successfully");
        router.push("/dashboard/crm/households");
        router.refresh();
      } else {
        toast.error(result.error || `Failed to ${isEditing ? "update" : "create"} household`);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  const selectedAddress = availableAddresses.find((a) => a.id === form.watch("addressId"));

  return (
    <Card className="mx-auto w-full max-w-3xl shadow-sm">
      <CardHeader>
        <CardTitle>{household ? "Edit Household" : "Add New Household"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4">
              <h3 className="border-b pb-2 font-medium text-sm">Basic Information</h3>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Household Name</FormLabel>
                    <FormControl>
                      <Input placeholder="The Smith Family" {...field} />
                    </FormControl>
                    <FormDescription>A descriptive name for this household group.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="addressId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Household Address</FormLabel>
                    <AddressSearchSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      addresses={availableAddresses}
                      onAddressCreated={(newAddr) => {
                        setAvailableAddresses((prev) => [...prev, newAddr]);
                        field.onChange(newAddr.id);
                      }}
                    />
                    {selectedAddress && (
                      <div className="mt-2 flex items-start gap-2 rounded-md border bg-muted/30 p-3 text-sm">
                        <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {selectedAddress.street1}
                            {selectedAddress.street2 ? `, ${selectedAddress.street2}` : ""}
                          </p>
                          <p className="text-muted-foreground">
                            {selectedAddress.city}, {selectedAddress.state} {selectedAddress.zipCode}
                          </p>
                        </div>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-medium text-sm">Household Members</h3>
                <p className="text-muted-foreground text-xs">{fields.length} member(s) added</p>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => {
                  const person = availablePeople.find((p) => p.id === field.personId);
                  return (
                    <div
                      key={field.id}
                      className="flex flex-col items-start justify-between gap-4 rounded-md border bg-muted/10 p-4 md:flex-row md:items-center"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-primary/10 p-2">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {person ? `${person.firstName} ${person.lastName}` : "Unknown Person"}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {person?.emails?.find((e) => e.isPrimary)?.address || person?.emails?.[0]?.address}
                          </p>
                        </div>
                      </div>

                      <div className="flex w-full items-center gap-2 md:w-auto">
                        <FormField
                          control={form.control}
                          name={`memberIds.${index}.role`}
                          render={({ field }) => (
                            <FormItem className="w-full md:w-40">
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="home_owner">Home Owner</SelectItem>
                                  <SelectItem value="dependent">Dependent</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          onClick={() => remove(index)}
                          className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {fields.length === 0 && (
                  <div className="rounded-md border border-dashed bg-muted/5 py-6 text-center">
                    <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground opacity-20" />
                    <p className="text-muted-foreground text-sm">No members added yet.</p>
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  <FormLabel>Add Person to Household</FormLabel>
                  <PersonSearchSelect
                    people={availablePeople.filter(
                      (p) => !form.getValues("memberIds").some((m) => m.personId === p.id),
                    )}
                    onValueChange={(val) => handleAddMember(val)}
                    onPersonCreated={(newPerson) => {
                      setAvailablePeople((prev) => [...prev, newPerson]);
                      handleAddMember(newPerson.id!);
                    }}
                    placeholder="Search people by name..."
                    value="" // We don't want to show a selected value here as it's an "adder"
                  />
                  <FormDescription>Select people to add them to this household group.</FormDescription>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t pt-6 font-semibold">
              <Button variant="outline" type="button" onClick={() => router.back()} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? household
                    ? "Updating..."
                    : "Creating..."
                  : household
                    ? "Update Household"
                    : "Create Household"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
