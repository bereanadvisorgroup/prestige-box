"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Briefcase, Building2, Fingerprint, Globe, MapPin, Phone, Plus, Trash2, Users } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

import { getAddresses } from "@/actions/addresses";
import { getClients } from "@/actions/clients";
import { createCompany, updateCompany } from "@/actions/companies";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddressSearchSelect } from "@/components/crm/address-search-select";
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { type Address, type Client, type Company, CompanySchema, US_STATES } from "@/types/crm";

interface CompanyFormProps {
  company?: Company;
}

export function CompanyForm({ company }: CompanyFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [availableClients, setAvailableClients] = useState<Client[]>([]);
  const [availableAddresses, setAvailableAddresses] = useState<Address[]>([]);

  const form = useForm<Company>({
    resolver: zodResolver(CompanySchema),
    defaultValues: company || {
      name: "",
      dba: "",
      ein: "",
      addressId: "",
      website: "",
      phone: "",
      clientIds: [],
      situsRecords: [],
      nexusRecords: [],
    },
  });

  const {
    fields: situsFields,
    append: appendSitus,
    remove: removeSitus,
  } = useFieldArray({
    control: form.control,
    name: "situsRecords",
  });

  const {
    fields: nexusFields,
    append: appendNexus,
    remove: removeNexus,
  } = useFieldArray({
    control: form.control,
    name: "nexusRecords",
  });

  useEffect(() => {
    async function fetchData() {
      const [clientsResult, addressesResult] = await Promise.all([getClients(), getAddresses()]);
      if (clientsResult.success && clientsResult.clients) {
        setAvailableClients(clientsResult.clients);
      }
      if (addressesResult.success && addressesResult.addresses) {
        setAvailableAddresses(addressesResult.addresses);
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

  async function onSubmit(values: Company) {
    try {
      setIsLoading(true);
      const isEditing = !!company?.id;

      let result;
      if (isEditing) {
        result = await updateCompany(company.id!, values);
      } else {
        result = await createCompany(values);
      }

      if (result.success) {
        toast.success(isEditing ? "Company record updated" : "Company record created");
        router.push("/dashboard/crm/companies");
        router.refresh();
      } else {
        toast.error(result.error || `Failed to ${isEditing ? "update" : "create"} company record`);
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
          <Building2 className="h-5 w-5" />
          {company ? "Edit Company" : "Add Company"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Corp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dba"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Doing Business As (DBA)</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Widgets" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Website
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="https://acmecorp.com" {...field} value={field.value || ""} />
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
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Number
                    </FormLabel>
                    <FormControl>
                      <PhoneInput placeholder="555-123-4567" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ein"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="flex items-center gap-2">
                      <Fingerprint className="h-4 w-4" />
                      EIN / Federal Tax ID
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="12-3456789" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormDescription>Format: XX-XXXXXXX</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="addressId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Company Address
                  </FormLabel>
                  <FormControl>
                    <AddressSearchSelect
                      value={field.value || ""}
                      onValueChange={field.onChange}
                      addresses={availableAddresses}
                      onAddressCreated={(newAddr) => {
                        setAvailableAddresses((prev) => [...prev, newAddr]);
                        field.onChange(newAddr.id);
                      }}
                    />
                  </FormControl>
                  <FormDescription>Select from shared addresses. Leave blank if unknown.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Situs Records
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendSitus({ jurisdiction: "DE", type: "Economic", effectiveDate: new Date().toISOString().split('T')[0] })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Situs
                </Button>
              </div>
              <div className="space-y-4">
                {situsFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end p-4 border rounded-md relative bg-muted/10">
                    <FormField
                      control={form.control}
                      name={`situsRecords.${index}.jurisdiction`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Jurisdiction</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {US_STATES.map((state) => (
                                <SelectItem key={state} value={state}>{state}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`situsRecords.${index}.type`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {["Physical", "Economic", "Administrative", "Trust"].map((type) => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`situsRecords.${index}.effectiveDate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Effective Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive self-end mb-0.5"
                      onClick={() => removeSitus(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {situsFields.length === 0 && (
                  <p className="text-xs text-muted-foreground italic h-10 flex items-center justify-center border rounded-md border-dashed">No situs records added.</p>
                )}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Nexus Records
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendNexus({ jurisdiction: "DE", type: "Sales Tax" })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Nexus
                </Button>
              </div>
              <div className="space-y-4">
                {nexusFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] gap-4 items-end p-4 border rounded-md relative bg-muted/10">
                    <FormField
                      control={form.control}
                      name={`nexusRecords.${index}.jurisdiction`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Jurisdiction</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {US_STATES.map((state) => (
                                <SelectItem key={state} value={state}>{state}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`nexusRecords.${index}.type`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {["Sales Tax", "Income Tax", "Payroll"].map((type) => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive self-end mb-0.5"
                      onClick={() => removeNexus(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {nexusFields.length === 0 && (
                  <p className="text-xs text-muted-foreground italic h-10 flex items-center justify-center border rounded-md border-dashed">No nexus records added.</p>
                )}
              </div>
            </div>

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
                            <ComboboxItem key={client.id} value={client.id!} label={`${person.firstName} ${person.lastName}`}>
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
                {isLoading ? "Saving..." : company ? "Update Company" : "Create Company"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
