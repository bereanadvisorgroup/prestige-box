"use client";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Globe, GraduationCap, MapPin, Phone, Trash2, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { getAddresses } from "@/actions/addresses";
import { getClients } from "@/actions/clients";
import { getCompanies } from "@/actions/companies";
import { createLawFirm, updateLawFirm } from "@/actions/law-firms";
import { getPeople } from "@/actions/people";
import { AddressSearchSelect } from "@/components/crm/address-search-select";
import { LogoUpload } from "@/components/crm/logo-upload";
import { PersonAvatar } from "@/components/crm/person-avatar";
import { PersonSearchSelect } from "@/components/crm/person-search-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  type Address,
  type Client,
  type Company,
  type LawFirm,
  type LawFirmFormInput,
  LawFirmFormSchema,
  type LawFirmFormValues,
  type Person,
} from "@/types/crm";

interface LawFirmFormProps {
  lawFirm?: LawFirm;
}

export function LawFirmForm({ lawFirm }: LawFirmFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [availableClients, setAvailableClients] = useState<(Client & { person: Person | null })[]>([]);
  const [availableCompanies, setAvailableCompanies] = useState<Company[]>([]);
  const [availableAddresses, setAvailableAddresses] = useState<Address[]>([]);
  const [availablePeople, setAvailablePeople] = useState<Person[]>([]);

  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [companySearchQuery, setCompanySearchQuery] = useState("");

  const form = useForm<LawFirmFormInput, any, LawFirmFormValues>({
    resolver: zodResolver(LawFirmFormSchema),
    defaultValues: lawFirm
      ? {
          personTitles: lawFirm.personTitles || {},
          id: lawFirm.id,
          personIds: lawFirm.personIds,
          firmName: lawFirm.firmName,
          firmAddressId: lawFirm.firmAddressId,
          website: lawFirm.website,
          phone: lawFirm.phone,
          clientIds: lawFirm.clientIds,
          companyIds: lawFirm.companyIds,
          logoUrl: lawFirm.logoUrl || null,
        }
      : {
          personIds: [],
          personTitles: {},
          firmName: "",
          firmAddressId: "",
          website: "",
          phone: "",
          clientIds: [],
          companyIds: [],
          logoUrl: null,
        },
  });

  const handleAddPerson = (personId: string) => {
    const current = form.getValues("personIds") || [];
    if (!current.includes(personId)) {
      form.setValue("personIds", [...current, personId]);
      form.trigger("personIds");
    } else {
      toast.error("This person is already associated with this law firm");
    }
  };

  const handleRemovePerson = (personId: string) => {
    const current = form.getValues("personIds") || [];
    form.setValue(
      "personIds",
      current.filter((id) => id !== personId),
    );
    form.trigger("personIds");

    const currentTitles = form.getValues("personTitles") || {};
    const newTitles = { ...currentTitles };
    delete newTitles[personId];
    form.setValue("personTitles", newTitles);
    form.trigger("personTitles");
  };

  useEffect(() => {
    async function fetchData() {
      const [clientsResult, companiesResult, addressesResult, peopleResult] = await Promise.all([
        getClients(),
        getCompanies(),
        getAddresses(),
        getPeople(),
      ]);
      if (clientsResult.success && clientsResult.clients) {
        setAvailableClients(clientsResult.clients);
      }
      if (companiesResult.success && companiesResult.companies) {
        setAvailableCompanies(companiesResult.companies);
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

  const watchedClientIds = form.watch("clientIds") || [];
  const watchedCompanyIds = form.watch("companyIds") || [];

  const filteredClients = useMemo(() => {
    const base = availableClients.filter((client) => !watchedClientIds.includes(client.id!));
    if (!clientSearchQuery) return base;
    return base.filter((c) => {
      const name = `${c.person?.firstName || ""} ${c.person?.lastName || ""}`;
      return name.toLowerCase().includes(clientSearchQuery.toLowerCase());
    });
  }, [availableClients, clientSearchQuery, watchedClientIds]);

  const filteredCompanies = useMemo(() => {
    const base = availableCompanies.filter((company) => !watchedCompanyIds.includes(company.id!));
    if (!companySearchQuery) return base;
    return base.filter((c) => c.name.toLowerCase().includes(companySearchQuery.toLowerCase()));
  }, [availableCompanies, companySearchQuery, watchedCompanyIds]);

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

  const handleToggleCompany = (companyId: string) => {
    const current = form.getValues("companyIds") || [];
    if (current.includes(companyId)) {
      form.setValue(
        "companyIds",
        current.filter((id) => id !== companyId),
      );
    } else {
      form.setValue("companyIds", [...current, companyId]);
    }
  };

  async function onSubmit(values: LawFirmFormValues) {
    try {
      setIsLoading(true);
      const isEditing = !!lawFirm?.id;

      const result = isEditing ? await updateLawFirm(lawFirm.id!, values) : await createLawFirm(values);

      if (result.success) {
        toast.success(isEditing ? "Law Firm record updated" : "Law Firm record created");
        window.dispatchEvent(new CustomEvent("association-change"));
        router.push("/dashboard/crm/law-firms");
        router.refresh();
      } else {
        toast.error(result.error || `Failed to ${isEditing ? "update" : "create"} law firm record`);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-3xl shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          {lawFirm ? "Edit Law Firm" : "Add Law Firm"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <LogoUpload
                      value={field.value}
                      onChange={field.onChange}
                      entityId={lawFirm?.id}
                      entityType="law-firms"
                      name={form.watch("firmName") || "Firm"}
                    />
                  </FormControl>
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

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                      <Input placeholder="https://example.com" {...field} value={field.value || ""} />
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
            </div>

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

            <FormField
              control={form.control}
              name="personIds"
              render={({ field }) => (
                <FormItem className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <FormLabel className="flex items-center gap-2 font-medium text-sm">
                      <Users className="h-4 w-4 text-primary" />
                      Associated Professionals
                    </FormLabel>
                    <span className="text-muted-foreground text-xs">
                      {(field.value || []).length} professional(s) added
                    </span>
                  </div>

                  <div className="space-y-4">
                    {(field.value || []).map((pId) => {
                      const person = availablePeople.find((p) => p.id === pId);
                      return (
                        <div
                          key={pId}
                          className="flex flex-col items-start justify-between gap-4 rounded-md border bg-muted/10 p-4 md:flex-row md:items-center"
                        >
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
                                {person?.emails?.find((e) => e.isPrimary)?.address ||
                                  person?.emails?.[0]?.address ||
                                  "No Email"}
                              </p>
                              <div className="mt-2 flex items-center gap-2">
                                <span className="text-[10px] text-muted-foreground font-semibold uppercase shrink-0">
                                  Title:
                                </span>
                                <Input
                                  size={20}
                                  placeholder="e.g. Managing Partner"
                                  value={(form.watch("personTitles") as Record<string, string>)?.[pId] || ""}
                                  onChange={(e) => {
                                    const currentTitles = form.getValues("personTitles") || {};
                                    form.setValue("personTitles", {
                                      ...currentTitles,
                                      [pId]: e.target.value,
                                    });
                                    form.trigger("personTitles");
                                  }}
                                  className="h-7 w-48 text-xs px-2"
                                />
                              </div>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={() => handleRemovePerson(pId)}
                            className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}

                    {(field.value || []).length === 0 && (
                      <div className="rounded-md border border-dashed bg-muted/5 py-6 text-center">
                        <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground opacity-20" />
                        <p className="text-muted-foreground text-sm">No professionals associated yet.</p>
                      </div>
                    )}

                    <div className="space-y-2 pt-2">
                      <FormLabel>Add Professional to Law Firm</FormLabel>
                      <PersonSearchSelect
                        people={availablePeople.filter((p) => !(field.value || []).includes(p.id!))}
                        onValueChange={(val) => handleAddPerson(val)}
                        onPersonCreated={(newPerson) => {
                          setAvailablePeople((prev) => [...prev, newPerson]);
                          handleAddPerson(newPerson.id!);
                        }}
                        placeholder="Search professionals by name..."
                        value=""
                      />
                      <FormDescription>Select professionals to add them to this firm.</FormDescription>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4 border-t pt-4">
              <h3 className="flex items-center gap-2 font-medium text-sm">
                <Users className="h-4 w-4 text-primary" />
                Associated Clients
              </h3>

              <div className="space-y-2">
                <Combobox
                  onValueChange={(val) => {
                    if (typeof val === "string") {
                      handleToggleClient(val);
                      setClientSearchQuery("");
                    }
                  }}
                  inputValue={clientSearchQuery}
                  onInputValueChange={setClientSearchQuery}
                >
                  <ComboboxInput placeholder="Search to link clients..." />
                  <ComboboxContent>
                    <ComboboxList>
                      {filteredClients.map((client) => {
                        const person = (client as { person?: { firstName: string; lastName: string } }).person;
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

              <div className="mt-4 flex min-h-[40px] flex-wrap gap-2 rounded-md border bg-muted/20 p-2">
                {(form.watch("clientIds") || []).length === 0 && (
                  <p className="p-1 text-muted-foreground text-xs italic">No clients linked yet.</p>
                )}
                {(form.watch("clientIds") || []).map((clientId) => {
                  const client = availableClients.find((c) => c.id === clientId);
                  const person = (client as { person?: { firstName: string; lastName: string } })?.person;
                  return (
                    <Badge
                      key={clientId}
                      variant="secondary"
                      className="gap-1 bg-secondary px-3 py-1 font-medium text-secondary-foreground shadow-sm"
                    >
                      {person ? `${person.firstName} ${person.lastName}` : "Unknown Client"}
                      <button
                        type="button"
                        onClick={() => handleToggleClient(clientId)}
                        className="ml-1 transition-colors hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>
            <div className="space-y-4 border-t pt-4">
              <h3 className="flex items-center gap-2 font-medium text-sm">
                <Users className="h-4 w-4 text-primary" />
                Associated Companies
              </h3>

              <div className="space-y-2">
                <Combobox
                  onValueChange={(val) => {
                    if (typeof val === "string") {
                      handleToggleCompany(val);
                      setCompanySearchQuery("");
                    }
                  }}
                  inputValue={companySearchQuery}
                  onInputValueChange={setCompanySearchQuery}
                >
                  <ComboboxInput placeholder="Search to link companies..." />
                  <ComboboxContent>
                    <ComboboxList>
                      {filteredCompanies.map((company) => (
                        <ComboboxItem key={company.id} value={company.id!} label={company.name}>
                          {company.name}
                        </ComboboxItem>
                      ))}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>

              <div className="mt-4 flex min-h-[40px] flex-wrap gap-2 rounded-md border bg-muted/20 p-2">
                {(form.watch("companyIds") || []).length === 0 && (
                  <p className="p-1 text-muted-foreground text-xs italic">No companies linked yet.</p>
                )}
                {(form.watch("companyIds") || []).map((companyId) => {
                  const company = availableCompanies.find((c) => c.id === companyId);
                  return (
                    <Badge
                      key={companyId}
                      variant="secondary"
                      className="gap-1 bg-secondary px-3 py-1 font-medium text-secondary-foreground shadow-sm"
                    >
                      {company ? company.name : "Unknown Company"}
                      <button
                        type="button"
                        onClick={() => handleToggleCompany(companyId)}
                        className="ml-1 transition-colors hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t pt-6 font-semibold">
              <Button variant="outline" type="button" onClick={() => router.back()} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="font-bold">
                {isLoading ? "Saving..." : lawFirm ? "Update Law Firm" : "Create Law Firm"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
