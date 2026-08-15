"use client";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Briefcase,
  Building2,
  Fingerprint,
  Globe,
  MapPin,
  Phone,
  Plus,
  Trash2,
  TrendingUp,
  UserCog,
  Users,
} from "lucide-react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { getAddresses } from "@/actions/addresses";
import { createCompany, updateCompany } from "@/actions/companies";
import { getPeople } from "@/actions/people";
import { getAdvisors } from "@/actions/users";
import { AddressSearchSelect } from "@/components/features/crm/address-search-select";
import { LogoUpload } from "@/components/features/crm/logo-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, formatPersonName } from "@/lib/utils";
import {
  type Address,
  type Company,
  type CompanyFormInput,
  CompanyFormSchema,
  type CompanyFormValues,
  type Person,
  US_STATES,
} from "@/types/crm";

interface CompanyFormProps {
  company?: Company;
  initialOwners?: any[];
  initialEmployees?: any[];
}

export function CompanyForm({ company, initialOwners = [], initialEmployees = [] }: CompanyFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [availablePeople, setAvailablePeople] = useState<Person[]>([]);
  const [availableAddresses, setAvailableAddresses] = useState<Address[]>([]);
  const [advisors, setAdvisors] = useState<{ uid: string; name: string }[]>([]);

  const [personSearchQuery, setPersonSearchQuery] = useState("");
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");

  const form = useForm<CompanyFormInput, any, CompanyFormValues>({
    resolver: zodResolver(CompanyFormSchema),
    defaultValues: company
      ? {
          id: company.id,
          name: company.name,
          dba: company.dba,
          ein: company.ein,
          addressId: company.addressId,
          website: company.website,
          phone: company.phone,
          advisorId: company.advisorId ?? null,
          logoUrl: company.logoUrl || null,
          socialMedia: (Array.isArray(company.socialMedia) ? company.socialMedia : []).map((sm: any) => ({
            id: sm.id || crypto.randomUUID(),
            type: sm.type || "Facebook",
            url: sm.url || "",
            isPrimary: sm.isPrimary || false,
            useProfilePhoto: sm.useProfilePhoto || false,
          })),
          owners: initialOwners.map((o) => ({
            personId: o.personId,
            ownershipPercentage: Number(o.ownershipPercentage) || 0,
          })),
          employees: initialEmployees.map((e) => ({
            personId: e.personId,
            jobTitle: e.jobTitle || "",
          })),
          situsRecords: (Array.isArray(company.situsRecords) ? company.situsRecords : []).map((s: any) => ({
            id: s.id,
            jurisdiction: s.jurisdiction || s.state || "DE",
            type: s.type || "Physical",
            effectiveDate: s.effectiveDate || new Date().toISOString().split("T")[0],
          })),
          nexusRecords: (Array.isArray(company.nexusRecords) ? company.nexusRecords : []).map((n: any) => ({
            id: n.id,
            jurisdiction: n.jurisdiction || n.state || "DE",
            type: n.type === "Sales Tax Nexus" ? "Sales Tax" : n.type || "Sales Tax",
          })),
          estimatedValue: company.estimatedValue ? Number(company.estimatedValue) : 0,
        }
      : {
          name: "",
          dba: "",
          ein: "",
          addressId: "",
          website: "",
          phone: "",
          advisorId: null,
          logoUrl: null,
          socialMedia: [],
          owners: [],
          employees: [],
          situsRecords: [],
          nexusRecords: [],
          estimatedValue: 0,
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

  const {
    fields: ownerFields,
    append: appendOwner,
    remove: removeOwner,
  } = useFieldArray({
    control: form.control,
    name: "owners",
  });

  const {
    fields: employeeFields,
    append: appendEmployee,
    remove: removeEmployee,
  } = useFieldArray({
    control: form.control,
    name: "employees",
  });

  const {
    fields: socialMediaFields,
    append: appendSocialMedia,
    remove: removeSocialMedia,
  } = useFieldArray({
    control: form.control,
    name: "socialMedia",
  });

  useEffect(() => {
    async function fetchData() {
      const [peopleResult, addressesResult, advisorsResult] = await Promise.all([
        getPeople(),
        getAddresses(),
        getAdvisors(),
      ]);
      if (peopleResult.success && peopleResult.people) {
        setAvailablePeople(peopleResult.people);
      }
      if (addressesResult.success && addressesResult.addresses) {
        setAvailableAddresses(addressesResult.addresses);
      }
      if (advisorsResult.success && advisorsResult.advisors) {
        setAdvisors(
          advisorsResult.advisors.map((a) => ({
            uid: a.uid,
            name: `${a.firstName} ${a.lastName}`.trim() || a.uid,
          })),
        );
      }
    }
    fetchData();
  }, []);

  const watchedOwners =
    useWatch({
      control: form.control,
      name: "owners",
    }) || [];
  const totalPercentage = useMemo(() => {
    return watchedOwners.reduce((sum, owner) => sum + (Number(owner.ownershipPercentage) || 0), 0);
  }, [watchedOwners]);
  const watchedPersonIds = watchedOwners.map((o) => o.personId);

  const watchedEmployees =
    useWatch({
      control: form.control,
      name: "employees",
    }) || [];
  const watchedEmployeePersonIds = watchedEmployees.map((e) => e.personId);

  const allAssignedPersonIds = useMemo(() => {
    return new Set([...watchedPersonIds, ...watchedEmployeePersonIds]);
  }, [watchedPersonIds, watchedEmployeePersonIds]);

  const filteredPeople = useMemo(() => {
    const base = availablePeople.filter((p) => !allAssignedPersonIds.has(p.id!));
    if (!personSearchQuery) return base;
    return base.filter((p) => {
      const name = formatPersonName(p, "");
      return name.toLowerCase().includes(personSearchQuery.toLowerCase());
    });
  }, [availablePeople, personSearchQuery, allAssignedPersonIds]);

  const filteredPeopleForEmployees = useMemo(() => {
    const base = availablePeople.filter((p) => !allAssignedPersonIds.has(p.id!));
    if (!employeeSearchQuery) return base;
    return base.filter((p) => {
      const name = formatPersonName(p, "");
      return name.toLowerCase().includes(employeeSearchQuery.toLowerCase());
    });
  }, [availablePeople, employeeSearchQuery, allAssignedPersonIds]);

  async function onSubmit(values: CompanyFormValues) {
    try {
      setIsLoading(true);
      const isEditing = !!company?.id;

      const result = isEditing ? await updateCompany(company.id!, values) : await createCompany(values);

      if (result.success) {
        toast.success(isEditing ? "Company record updated" : "Company record created");
        router.push(isEditing ? `/dashboard/crm/companies/${company.id}` : "/dashboard/crm/companies");
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
    <Card className="mx-auto w-full max-w-3xl shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {company ? "Edit Company" : "Add Company"}
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
                      entityType="companies"
                      name={form.watch("name") || "Company"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                  <FormItem>
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

              <FormField
                control={form.control}
                name="estimatedValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Current Estimated Value
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))}
                        value={field.value ?? 0}
                      />
                    </FormControl>
                    <FormDescription>Estimated valuation of the company.</FormDescription>
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

            <FormField
              control={form.control}
              name="advisorId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex items-center gap-2">
                    <UserCog className="h-4 w-4" />
                    Assigned Advisor
                  </FormLabel>
                  <Select
                    value={field.value ?? "none"}
                    onValueChange={(val) => field.onChange(val === "none" ? null : val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select advisor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {advisors.map((a) => (
                        <SelectItem key={a.uid} value={a.uid}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>The admin or advisor responsible for this company.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Social Media Section */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <FormLabel className="text-base font-semibold">Social Media Accounts</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendSocialMedia({
                      id: crypto.randomUUID(),
                      type: "Facebook",
                      url: "",
                      isPrimary: false,
                      useProfilePhoto: false,
                    })
                  }
                >
                  <Plus className="mr-1 h-4 w-4" /> Add Social Media
                </Button>
              </div>
              {socialMediaFields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex flex-col items-end gap-3 rounded-md border bg-muted/20 p-3 sm:flex-row"
                >
                  <FormField
                    control={form.control}
                    name={`socialMedia.${index}.url`}
                    render={({ field: inputField }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-xs">URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...inputField} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`socialMedia.${index}.type`}
                    render={({ field: selectField }) => (
                      <FormItem className="w-full sm:w-32">
                        <FormLabel className="text-xs">Type</FormLabel>
                        <Select onValueChange={selectField.onChange} defaultValue={selectField.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Facebook">Facebook</SelectItem>
                            <SelectItem value="Instagram">Instagram</SelectItem>
                            <SelectItem value="X">X</SelectItem>
                            <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                            <SelectItem value="YouTube">YouTube</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`socialMedia.${index}.isPrimary`}
                    render={({ field: checkField }) => (
                      <FormItem className="flex flex-col items-center justify-end px-2 pb-2">
                        <FormLabel className="mb-2 text-xs">Primary</FormLabel>
                        <FormControl>
                          <input
                            type="radio"
                            name="primarySocialMedia"
                            checked={checkField.value}
                            onChange={() => {
                              const currentSM = form.getValues("socialMedia") || [];
                              currentSM.forEach((_, i) => {
                                form.setValue(`socialMedia.${i}.isPrimary`, false);
                              });
                              form.setValue(`socialMedia.${index}.isPrimary`, true);
                            }}
                            className="h-4 w-4"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`socialMedia.${index}.useProfilePhoto`}
                    render={({ field: checkField }) => (
                      <FormItem className="flex flex-col items-center justify-end px-2 pb-2">
                        <FormLabel className="mb-2 text-xs">Use Photo</FormLabel>
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={checkField.value}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const currentSM = form.getValues("socialMedia") || [];
                              currentSM.forEach((_, i) => {
                                form.setValue(`socialMedia.${i}.useProfilePhoto`, false);
                              });
                              if (checked) {
                                form.setValue(`socialMedia.${index}.useProfilePhoto`, true);
                              }
                            }}
                            className="h-4 w-4"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSocialMedia(index)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {socialMediaFields.length === 0 && (
                <p className="flex h-10 items-center justify-center rounded-md border border-dashed text-muted-foreground text-xs italic">
                  No social media accounts added.
                </p>
              )}
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-medium text-sm">
                  <MapPin className="h-4 w-4 text-primary" />
                  Situs Records
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendSitus({
                      jurisdiction: "DE",
                      type: "Economic",
                      effectiveDate: new Date().toISOString().split("T")[0],
                    })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Situs
                </Button>
              </div>
              <div className="space-y-4">
                {situsFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="relative grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-4 rounded-md border bg-muted/10 p-4"
                  >
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
                                <SelectItem key={state} value={state}>
                                  {state}
                                </SelectItem>
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
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
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
                      className="mb-0.5 self-end text-muted-foreground hover:text-destructive"
                      onClick={() => removeSitus(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {situsFields.length === 0 && (
                  <p className="flex h-10 items-center justify-center rounded-md border border-dashed text-muted-foreground text-xs italic">
                    No situs records added.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-medium text-sm">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Nexus Records
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendNexus({ jurisdiction: "DE", type: "Sales Tax" })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Nexus
                </Button>
              </div>
              <div className="space-y-4">
                {nexusFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="relative grid grid-cols-[1fr_1fr_auto] items-end gap-4 rounded-md border bg-muted/10 p-4"
                  >
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
                                <SelectItem key={state} value={state}>
                                  {state}
                                </SelectItem>
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
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
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
                      className="mb-0.5 self-end text-muted-foreground hover:text-destructive"
                      onClick={() => removeNexus(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {nexusFields.length === 0 && (
                  <p className="flex h-10 items-center justify-center rounded-md border border-dashed text-muted-foreground text-xs italic">
                    No nexus records added.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-medium text-sm">
                  <Users className="h-4 w-4 text-primary" />
                  Company Owners
                </h3>
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 font-semibold text-xs shadow-sm transition-all duration-300",
                    totalPercentage > 100
                      ? "animate-pulse border-destructive/20 bg-destructive/10 text-destructive"
                      : totalPercentage === 100
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : "border-muted-foreground/20 bg-muted text-muted-foreground",
                  )}
                >
                  Total Ownership: {totalPercentage.toFixed(2)}% / 100%
                </span>
              </div>

              <div className="space-y-2">
                <Combobox
                  onValueChange={(val) => {
                    if (typeof val === "string") {
                      appendOwner({ personId: val, ownershipPercentage: 0 });
                      setPersonSearchQuery("");
                    }
                  }}
                  inputValue={personSearchQuery}
                  onInputValueChange={setPersonSearchQuery}
                >
                  <ComboboxInput placeholder="Search to add owner..." />
                  <ComboboxContent>
                    <ComboboxList>
                      {filteredPeople.map((person) => (
                        <ComboboxItem key={person.id} value={person.id!} label={formatPersonName(person)}>
                          {formatPersonName(person)}
                        </ComboboxItem>
                      ))}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                {(form.formState.errors.owners?.message || form.formState.errors.owners?.root?.message) && (
                  <p className="mt-1 font-semibold text-destructive text-xs">
                    {(form.formState.errors.owners.message || form.formState.errors.owners.root?.message) as string}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                {ownerFields.map((field, index) => {
                  const person = availablePeople.find((p) => p.id === field.personId);
                  const name = person ? formatPersonName(person) : "Unknown Person";
                  return (
                    <div
                      key={field.id}
                      className="relative grid grid-cols-[2fr_1fr_auto] items-end gap-4 rounded-md border bg-muted/10 p-4"
                    >
                      <div className="flex flex-col gap-1.5">
                        <span className="font-medium text-muted-foreground text-xs">Owner Name</span>
                        <div className="flex h-10 items-center rounded-md border bg-background px-3 py-2 text-sm">
                          {name}
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name={`owners.${index}.ownershipPercentage`}
                        render={({ field: formField }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Ownership Percentage (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                placeholder="e.g. 50"
                                {...formField}
                                onChange={(e) => formField.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mb-0.5 self-end text-muted-foreground hover:text-destructive"
                        onClick={() => removeOwner(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
                {ownerFields.length === 0 && (
                  <p className="flex h-10 items-center justify-center rounded-md border border-dashed text-muted-foreground text-xs italic">
                    No owners added.
                  </p>
                )}
              </div>
            </div>

            {/* Company Employees Section */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-medium text-sm">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Company Employees
                </h3>
              </div>

              <div className="space-y-2">
                <Combobox
                  onValueChange={(val) => {
                    if (typeof val === "string") {
                      appendEmployee({ personId: val, jobTitle: "" });
                      setEmployeeSearchQuery("");
                    }
                  }}
                  inputValue={employeeSearchQuery}
                  onInputValueChange={setEmployeeSearchQuery}
                >
                  <ComboboxInput placeholder="Search to add employee..." />
                  <ComboboxContent>
                    <ComboboxList>
                      {filteredPeopleForEmployees.map((person) => (
                        <ComboboxItem key={person.id} value={person.id!} label={formatPersonName(person)}>
                          {formatPersonName(person)}
                        </ComboboxItem>
                      ))}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                {(form.formState.errors.employees?.message || form.formState.errors.employees?.root?.message) && (
                  <p className="mt-1 font-semibold text-destructive text-xs">
                    {
                      (form.formState.errors.employees.message ||
                        form.formState.errors.employees.root?.message) as string
                    }
                  </p>
                )}
              </div>

              <div className="space-y-4">
                {employeeFields.map((field, index) => {
                  const person = availablePeople.find((p) => p.id === field.personId);
                  const name = person ? formatPersonName(person) : "Unknown Person";
                  return (
                    <div
                      key={field.id}
                      className="relative grid grid-cols-[2fr_1fr_auto] items-end gap-4 rounded-md border bg-muted/10 p-4"
                    >
                      <div className="flex flex-col gap-1.5">
                        <span className="font-medium text-muted-foreground text-xs">Employee Name</span>
                        <div className="flex h-10 items-center rounded-md border bg-background px-3 py-2 text-sm">
                          {name}
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name={`employees.${index}.jobTitle`}
                        render={({ field: formField }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Job Title / Role</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Software Engineer"
                                {...formField}
                                value={formField.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mb-0.5 self-end text-muted-foreground hover:text-destructive"
                        onClick={() => removeEmployee(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
                {employeeFields.length === 0 && (
                  <p className="flex h-10 items-center justify-center rounded-md border border-dashed text-muted-foreground text-xs italic">
                    No employees added.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t pt-6 font-semibold">
              <Button variant="outline" type="button" onClick={() => router.back()} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || totalPercentage > 100} className="font-bold">
                {isLoading ? "Saving..." : company ? "Update Company" : "Create Company"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
