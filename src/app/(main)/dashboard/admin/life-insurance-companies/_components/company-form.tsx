"use client";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Globe, ListPlus, Phone, Shield, Trash2, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { getCompanies } from "@/actions/companies";
import { createLifeInsuranceCompany, updateLifeInsuranceCompany } from "@/actions/life-insurance-companies";
import { getPeople } from "@/actions/people";
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
  type Company,
  type LifeInsuranceCompany,
  type LifeInsuranceCompanyFormInput,
  LifeInsuranceCompanyFormSchema,
  type LifeInsuranceCompanyFormValues,
  type Person,
} from "@/types/crm";

interface CompanyFormProps {
  company?: LifeInsuranceCompany;
}

export function CompanyForm({ company }: CompanyFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [newPolicyName, setNewPolicyName] = useState("");
  const [availablePeople, setAvailablePeople] = useState<Person[]>([]);
  const [availableCompanies, setAvailableCompanies] = useState<Company[]>([]);

  const [companySearchQuery, setCompanySearchQuery] = useState("");

  const form = useForm<LifeInsuranceCompanyFormInput, any, LifeInsuranceCompanyFormValues>({
    resolver: zodResolver(LifeInsuranceCompanyFormSchema),
    defaultValues: company
      ? {
          personTitles: company.personTitles || {},
          id: company.id,
          name: company.name,
          websiteUrl: company.websiteUrl,
          policyNames: company.policyNames,
          phone: company.phone,
          personIds: company.personIds,
          companyIds: company.companyIds,
          logoUrl: company.logoUrl || null,
        }
      : {
          name: "",
          websiteUrl: "",
          policyNames: [],
          phone: "",
          personIds: [],
          personTitles: {},
          companyIds: [],
          logoUrl: null,
        },
  });

  useEffect(() => {
    async function fetchData() {
      const [peopleResult, companiesResult] = await Promise.all([getPeople(), getCompanies()]);
      if (peopleResult.success && peopleResult.people) {
        setAvailablePeople(peopleResult.people);
      }
      if (companiesResult.success && companiesResult.companies) {
        setAvailableCompanies(companiesResult.companies);
      }
    }
    fetchData();
  }, []);

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

  const handleAddPerson = (personId: string) => {
    const current = form.getValues("personIds") || [];
    if (!current.includes(personId)) {
      form.setValue("personIds", [...current, personId]);
      form.trigger("personIds");
    } else {
      toast.error("This person is already associated with this company");
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

  async function onSubmit(values: LifeInsuranceCompanyFormValues) {
    try {
      setIsLoading(true);
      const isEditing = !!company?.id;

      const result = isEditing
        ? await updateLifeInsuranceCompany(company.id!, values)
        : await createLifeInsuranceCompany(values);

      if (result.success) {
        toast.success(isEditing ? "Life insurance company updated" : "Life insurance company created");
        router.push("/dashboard/admin/life-insurance-companies");
        router.refresh();
      } else {
        toast.error(result.error || `Failed to ${isEditing ? "update" : "create"} company`);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleAddPolicy = () => {
    if (!newPolicyName.trim()) return;
    const current = form.getValues("policyNames") || [];
    if (current.includes(newPolicyName.trim())) {
      toast.error("Policy already exists");
      return;
    }
    form.setValue("policyNames", [...current, newPolicyName.trim()]);
    setNewPolicyName("");
  };

  const handleRemovePolicy = (name: string) => {
    const current = form.getValues("policyNames") || [];
    form.setValue(
      "policyNames",
      current.filter((n) => n !== name),
    );
  };

  return (
    <Card className="mx-auto w-full max-w-2xl shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Shield className="h-5 w-5 text-primary" />
          {company ? "Edit Life Insurance Company" : "Add Life Insurance Company"}
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
                      entityId={company?.id}
                      entityType="life-insurance-companies"
                      name={form.watch("name") || "Company"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="md:col-span-1">
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Progressive" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="websiteUrl"
                render={({ field }) => (
                  <FormItem className="md:col-span-1">
                    <FormLabel>Website URL</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Globe className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-9" placeholder="progressive.com" {...field} />
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
                  <FormItem className="md:col-span-1">
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
              name="personIds"
              render={({ field }) => (
                <FormItem className="space-y-4 pt-2">
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
                      <FormLabel>Add Professional to Life Insurance Company</FormLabel>
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
                      <FormDescription>Select professionals to add them to this company.</FormDescription>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="flex items-center gap-2 font-semibold text-sm">
                  <ListPlus className="h-4 w-4" />
                  Supported Policy Names
                </h3>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Homeowners Gold"
                  value={newPolicyName}
                  onChange={(e) => setNewPolicyName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddPolicy();
                    }
                  }}
                />
                <Button type="button" variant="secondary" onClick={handleAddPolicy}>
                  Add
                </Button>
              </div>

              <div className="mt-4 flex min-h-[40px] flex-wrap gap-2 rounded-md border bg-muted/20 p-2">
                {(form.watch("policyNames") || []).length === 0 && (
                  <span className="p-1 text-muted-foreground text-xs italic">No policies added yet.</span>
                )}
                {(form.watch("policyNames") || []).map((policy, index) => (
                  <Badge key={index} variant="secondary" className="group gap-1 px-3 py-1">
                    {policy}
                    <button
                      type="button"
                      onClick={() => handleRemovePolicy(policy)}
                      className="ml-1 rounded-full transition-colors hover:bg-destructive-foreground/20"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
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
                    if (typeof val === "string") handleToggleCompany(val);
                  }}
                >
                  <ComboboxInput placeholder="Search to link companies..." />
                  <ComboboxContent>
                    <ComboboxList>
                      {availableCompanies
                        .filter((company) => !(form.getValues("companyIds") || []).includes(company.id!))
                        .map((company) => (
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
                {isLoading ? "Saving..." : company ? "Update Company" : "Create Company"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
