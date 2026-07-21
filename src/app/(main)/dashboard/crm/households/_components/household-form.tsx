"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2, Users } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

import { getAddresses } from "@/actions/addresses";
import { createHousehold, updateHousehold } from "@/actions/households";
import { getPeople } from "@/actions/people";
import { AddressSearchSelect } from "@/components/crm/address-search-select";
import { PersonAvatar } from "@/components/crm/person-avatar";
import { PersonSearchSelect } from "@/components/crm/person-search-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  type Address,
  type Household,
  type HouseholdFormInput,
  HouseholdFormSchema,
  type HouseholdFormValues,
  type Person,
} from "@/types/crm";

interface HouseholdFormProps {
  household?: Household;
}

export function HouseholdForm({ household }: HouseholdFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [availableAddresses, setAvailableAddresses] = useState<Address[]>([]);
  const [availablePeople, setAvailablePeople] = useState<Person[]>([]);

  const form = useForm<HouseholdFormInput, any, HouseholdFormValues>({
    resolver: zodResolver(HouseholdFormSchema),
    defaultValues: household
      ? {
          id: household.id,
          name: household.name,
          addressId: household.addressId,
          members: household.members || [],
        }
      : {
          name: "",
          addressId: "",
          members: [],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "members",
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
    const currentMembers = form.getValues("members") || [];
    if (!currentMembers.some((m) => m.clientId === personId)) {
      append({
        clientId: personId,
        role: currentMembers.length === 0 ? "HEAD" : "MEMBER",
        isPrimaryHousehold: true,
        includeInFinancialRollup: true,
        familyRelationship: "",
      });
    } else {
      toast.error("This person is already a member of this household");
    }
  };

  async function onSubmit(values: HouseholdFormValues) {
    try {
      setIsLoading(true);
      const isEditing = !!household?.id;

      const result = isEditing ? await updateHousehold(household.id!, values) : await createHousehold(values);

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

  return (
    <Card className="mx-auto w-full max-w-4xl shadow-sm">
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
                  const person = availablePeople.find((p) => p.id === field.clientId);
                  return (
                    <div
                      key={field.id}
                      className="flex flex-col items-start justify-between gap-4 rounded-md border bg-muted/10 p-4"
                    >
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-3">
                          <PersonAvatar
                            photoUrl={person?.photoUrl}
                            firstName={person?.firstName}
                            lastName={person?.lastName}
                            size="sm"
                          />
                          <div>
                            <p className="font-medium text-sm">
                              {person ? `${person.firstName} ${person.lastName}` : "Unknown Person"}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {person?.emails?.find((e) => e.isPrimary)?.address || person?.emails?.[0]?.address}
                            </p>
                          </div>
                        </div>

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

                      <div className="grid w-full grid-cols-1 gap-4 pt-2 md:grid-cols-3">
                        <FormField
                          control={form.control}
                          name={`members.${index}.role`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Household Role</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder="Select role" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="HEAD">Head of Household</SelectItem>
                                  <SelectItem value="SPOUSE">Spouse</SelectItem>
                                  <SelectItem value="PARTNER">Partner</SelectItem>
                                  <SelectItem value="DEPENDENT">Dependent</SelectItem>
                                  <SelectItem value="TRUSTEE">Trustee</SelectItem>
                                  <SelectItem value="MEMBER">Member</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`members.${index}.familyRelationship`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Relationship Description</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Spouse of Head, Daughter" className="h-9 text-xs" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex flex-col gap-2 pt-1">
                          <FormField
                            control={form.control}
                            name={`members.${index}.isPrimaryHousehold`}
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between rounded-md border bg-background p-2">
                                <FormLabel className="font-normal text-xs">Primary Household</FormLabel>
                                <FormControl>
                                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`members.${index}.includeInFinancialRollup`}
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between rounded-md border bg-background p-2">
                                <FormLabel className="font-normal text-xs">Financial Rollup</FormLabel>
                                <FormControl>
                                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
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
                      (p) => !(form.getValues("members") || []).some((m) => m.clientId === p.id),
                    )}
                    onValueChange={(val) => handleAddMember(val)}
                    onPersonCreated={(newPerson) => {
                      setAvailablePeople((prev) => [...prev, newPerson]);
                      handleAddMember(newPerson.id!);
                    }}
                    placeholder="Search people by name..."
                    value="" // Adder input resets selection
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
