"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { GraduationCap, MapPin, Plus, Trash2, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { getAddresses } from "@/actions/addresses";
import { getClients } from "@/actions/clients";
import { createLawyer, updateLawyer } from "@/actions/lawyers";
import { getPeople } from "@/actions/people";
import { AddressSearchSelect } from "@/components/crm/address-search-select";
import { PersonSearchSelect } from "@/components/crm/person-search-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { type Address, type Client, type Lawyer, LawyerSchema, type Person } from "@/types/crm";

interface LawyerFormProps {
  lawyer?: Lawyer;
}

export function LawyerForm({ lawyer }: LawyerFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [availableClients, setAvailableClients] = useState<Client[]>([]);
  const [availableAddresses, setAvailableAddresses] = useState<Address[]>([]);
  const [availablePeople, setAvailablePeople] = useState<Person[]>([]);

  const form = useForm<Lawyer>({
    resolver: zodResolver(LawyerSchema),
    defaultValues: lawyer || {
      personId: "",
      firmName: "",
      firmAddressId: "",
      clientIds: [],
    },
  });

  useEffect(() => {
    async function fetchData() {
      const [clientsResult, addressesResult, peopleResult] = await Promise.all([
        getClients(),
        getAddresses(),
        getPeople(),
      ]);
      if (clientsResult.success && clientsResult.clients) {
        setAvailableClients(clientsResult.clients);
      }
      if (addressesResult.success && addressesResult.addresses) {
        setAvailableAddresses(addressesResult.addresses);
      }
      if (peopleResult.success && peopleResult.people) {
        setAvailablePeople(peopleResult.people);
      }
    }
    fetchData();
  }, []);

  const handleToggleClient = (clientId: string) => {
    const current = form.getValues("clientIds") || [];
    if (current.includes(clientId)) {
      form.setValue(
        "clientIds",
        current.filter((id) => id !== clientId),
      );
    } else {
      form.setValue("clientIds", [...current, clientId]);
    }
  };

  async function onSubmit(values: Lawyer) {
    try {
      setIsLoading(true);
      const isEditing = !!lawyer?.id;

      let result;
      if (isEditing) {
        result = await updateLawyer(lawyer.id!, values);
      } else {
        result = await createLawyer(values);
      }

      if (result.success) {
        toast.success(isEditing ? "Lawyer record updated" : "Lawyer record created");
        router.push("/dashboard/crm/lawyers");
        router.refresh();
      } else {
        toast.error(result.error || `Failed to ${isEditing ? "update" : "create"} lawyer record`);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          {lawyer ? "Edit Lawyer" : "Add Lawyer"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="personId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Lawyer Name (Person)
                  </FormLabel>
                  <PersonSearchSelect
                    value={field.value || ""}
                    onValueChange={(val) => field.onChange(val)}
                    people={availablePeople}
                    onPersonCreated={(newPerson) => {
                      setAvailablePeople((prev) => [...prev, newPerson]);
                      field.onChange(newPerson.id);
                    }}
                  />
                  <FormDescription>Select the person record for this lawyer.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="firmName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Law Firm Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Justice & Associates" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="firmAddressId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Firm Address
                  </FormLabel>
                  <AddressSearchSelect
                    value={field.value || ""}
                    onValueChange={field.onChange}
                    addresses={availableAddresses}
                    onAddressCreated={(newAddr) => {
                      setAvailableAddresses((prev) => [...prev, newAddr]);
                      field.onChange(newAddr.id);
                    }}
                  />
                  <FormDescription>Select from shared addresses.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Associated Clients
              </h3>

              <div className="space-y-2">
                <Combobox
                  onValueChange={(val: any) => {
                    if (typeof val === "string") handleToggleClient(val);
                  }}
                >
                  <ComboboxInput placeholder="Search to link clients..." />
                  <ComboboxContent>
                    <ComboboxList>
                      {availableClients
                        .filter((client) => !(form.getValues("clientIds") || []).includes(client.id!))
                        .map((client) => {
                          const person = (client as any).person;
                          if (!person) return null;
                          return (
                            <ComboboxItem
                              key={client.id}
                              value={client.id!}
                              label={`${person.firstName} ${person.lastName}`}
                            >
                              {person.firstName} {person.lastName}
                            </ComboboxItem>
                          );
                        })}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>

              <div className="flex flex-wrap gap-2 mt-4 min-h-[40px] p-2 bg-muted/20 rounded-md border">
                {(form.watch("clientIds") || []).length === 0 && (
                  <p className="text-xs text-muted-foreground p-1 italic">No clients linked yet.</p>
                )}
                {(form.watch("clientIds") || []).map((clientId) => {
                  const client = availableClients.find((c) => c.id === clientId);
                  const person = (client as any)?.person;
                  return (
                    <Badge
                      key={clientId}
                      variant="secondary"
                      className="gap-1 px-3 py-1 font-medium bg-secondary text-secondary-foreground shadow-sm"
                    >
                      {person ? `${person.firstName} ${person.lastName}` : "Unknown Client"}
                      <button
                        type="button"
                        onClick={() => handleToggleClient(clientId)}
                        className="ml-1 hover:text-destructive transition-colors"
                      >
                        ×
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t font-semibold">
              <Button variant="outline" type="button" onClick={() => router.back()} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="font-bold">
                {isLoading ? "Saving..." : lawyer ? "Update Lawyer" : "Create Lawyer"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
