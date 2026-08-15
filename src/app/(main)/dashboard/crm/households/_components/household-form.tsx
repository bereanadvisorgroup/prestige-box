"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Heart, Plus, ShieldCheck, Tag, Trash2, UserCheck, Users } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

import { getAddresses } from "@/actions/addresses";
import { createHousehold, updateHousehold } from "@/actions/households";
import { getPeople } from "@/actions/people";
import { AddressSearchSelect } from "@/components/features/crm/address-search-select";
import { PersonAvatar } from "@/components/features/crm/person-avatar";
import { PersonSearchSelect } from "@/components/features/crm/person-search-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { formatPersonName } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const DESCENDANT_ROLES = [
  "SON",
  "DAUGHTER",
  "GRANDSON",
  "GRANDDAUGHTER",
  "GREAT_GRANDSON",
  "GREAT_GRANDDAUGHTER",
  "DEPENDENT",
];

function isDescendantRole(role: string) {
  return DESCENDANT_ROLES.includes(role);
}

export function HouseholdForm({ household }: HouseholdFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [availableAddresses, setAvailableAddresses] = useState<Address[]>([]);
  const [availablePeople, setAvailablePeople] = useState<Person[]>([]);
  const [newCustomTagMap, setNewCustomTagMap] = useState<Record<number, string>>({});

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

  const { fields, append, remove, update } = useFieldArray({
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

  const headIndex = fields.findIndex((f) => f.role === "HEAD");
  const spouseIndex = fields.findIndex((f) => ["SPOUSE", "PARTNER"].includes(f.role));

  const headMember = headIndex >= 0 ? fields[headIndex] : null;
  const spouseMember = spouseIndex >= 0 ? fields[spouseIndex] : null;

  const handleAssignHead = (personId: string) => {
    const currentMembers = form.getValues("members") || [];
    const existingIndex = currentMembers.findIndex((m) => m.clientId === personId);

    if (existingIndex >= 0) {
      // Update role to HEAD
      const existing = currentMembers[existingIndex];
      update(existingIndex, { ...existing, role: "HEAD" });
    } else {
      append({
        clientId: personId,
        role: "HEAD",
        isPrimaryHousehold: true,
        includeInFinancialRollup: true,
        familyRelationship: "Head of Household",
        tags: [],
      });
    }
  };

  const handleAssignSpouse = (personId: string, role: "SPOUSE" | "PARTNER" = "SPOUSE") => {
    const currentMembers = form.getValues("members") || [];
    const existingIndex = currentMembers.findIndex((m) => m.clientId === personId);

    if (existingIndex >= 0) {
      const existing = currentMembers[existingIndex];
      update(existingIndex, { ...existing, role });
    } else {
      append({
        clientId: personId,
        role,
        isPrimaryHousehold: true,
        includeInFinancialRollup: true,
        familyRelationship: role === "SPOUSE" ? "Spouse" : "Partner",
        tags: [],
      });
    }
  };

  const handleAddOtherMember = (personId: string) => {
    const currentMembers = form.getValues("members") || [];
    if (!currentMembers.some((m) => m.clientId === personId)) {
      append({
        clientId: personId,
        role: "SON",
        parentage: "BOTH",
        isPrimaryHousehold: true,
        includeInFinancialRollup: true,
        familyRelationship: "",
        tags: [],
      });
    } else {
      toast.error("This person is already a member of this household");
    }
  };

  const toggleTrusteeTag = (index: number) => {
    const currentMembers = form.getValues("members");
    const member = currentMembers[index];
    if (!member) return;

    const currentTags = member.tags || [];
    const hasTrustee = currentTags.includes("Trustee");
    const updatedTags = hasTrustee ? currentTags.filter((t) => t !== "Trustee") : [...currentTags, "Trustee"];

    update(index, {
      ...member,
      tags: updatedTags,
    });
  };

  const handleAddCustomTag = (index: number) => {
    const tagText = (newCustomTagMap[index] || "").trim();
    if (!tagText) return;

    const currentMembers = form.getValues("members");
    const member = currentMembers[index];
    if (!member) return;

    const currentTags = member.tags || [];
    if (currentTags.includes(tagText)) {
      setNewCustomTagMap((prev) => ({ ...prev, [index]: "" }));
      return;
    }

    update(index, {
      ...member,
      tags: [...currentTags, tagText],
    });

    setNewCustomTagMap((prev) => ({ ...prev, [index]: "" }));
  };

  const handleRemoveTag = (index: number, tagToRemove: string) => {
    const currentMembers = form.getValues("members");
    const member = currentMembers[index];
    if (!member) return;

    const updatedTags = (member.tags || []).filter((t) => t !== tagToRemove);
    update(index, {
      ...member,
      tags: updatedTags,
    });
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
            {/* Basic Info */}
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

            {/* Primary Roles: Head & Spouse/Partner Spots */}
            <div className="space-y-4 pt-2">
              <div className="border-b pb-2">
                <h3 className="font-medium text-sm">Primary Household Leaders</h3>
                <p className="text-muted-foreground text-xs">
                  Select one Head of Household and one Spouse or Partner to lead the household structure.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Head of Household Spot */}
                <Card
                  className={`border-2 transition-all ${headMember ? "border-primary/40 bg-primary/5" : "border-dashed bg-muted/10 hover:border-primary/40"}`}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between font-semibold text-sm">
                      <span className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-primary" /> Head of Household
                      </span>
                      <Badge variant={headMember ? "default" : "outline"} className="text-[10px]">
                        {headMember ? "Assigned" : "1 Spot Available"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-1">
                    {headMember ? (
                      (() => {
                        const person = availablePeople.find((p) => p.id === headMember.clientId);
                        const isTrustee = (headMember.tags || []).includes("Trustee");

                        return (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <PersonAvatar
                                  photoUrl={person?.photoUrl}
                                  firstName={person?.firstName}
                                  lastName={person?.lastName}
                                  size="default"
                                />
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-sm">
                                    {formatPersonName(person, "Selected Person")}
                                  </p>
                                  <p className="truncate text-muted-foreground text-xs">
                                    {person?.emails?.find((e) => e.isPrimary)?.address ||
                                      person?.emails?.[0]?.address ||
                                      "No email"}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                type="button"
                                onClick={() => remove(headIndex)}
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive text-xs"
                              >
                                Clear
                              </Button>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 pt-1 border-t">
                              <Button
                                type="button"
                                variant={isTrustee ? "default" : "outline"}
                                size="sm"
                                onClick={() => toggleTrusteeTag(headIndex)}
                                className="h-7 text-xs gap-1"
                              >
                                <ShieldCheck className="h-3.5 w-3.5" />
                                {isTrustee ? "Trustee Tagged" : "+ Trustee Tag"}
                              </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                              <FormField
                                control={form.control}
                                name={`members.${headIndex}.isPrimaryHousehold`}
                                render={({ field }) => (
                                  <FormItem className="flex items-center justify-between rounded-md border bg-background p-2">
                                    <FormLabel className="font-normal text-[11px]">Primary Household</FormLabel>
                                    <FormControl>
                                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`members.${headIndex}.includeInFinancialRollup`}
                                render={({ field }) => (
                                  <FormItem className="flex items-center justify-between rounded-md border bg-background p-2">
                                    <FormLabel className="font-normal text-[11px]">Financial Rollup</FormLabel>
                                    <FormControl>
                                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="space-y-3 py-3 text-center">
                        <p className="text-muted-foreground text-xs">
                          No Head of Household selected. Click below to pick a person for this role.
                        </p>
                        <PersonSearchSelect
                          people={availablePeople.filter((p) => !fields.some((m) => m.clientId === p.id))}
                          onValueChange={(val) => handleAssignHead(val)}
                          onPersonCreated={(newPerson) => {
                            setAvailablePeople((prev) => [...prev, newPerson]);
                            handleAssignHead(newPerson.id!);
                          }}
                          placeholder="Select Head of Household..."
                          value=""
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Spouse / Partner Spot */}
                <Card
                  className={`border-2 transition-all ${spouseMember ? "border-rose-500/40 bg-rose-500/5" : "border-dashed bg-muted/10 hover:border-rose-500/40"}`}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between font-semibold text-sm">
                      <span className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-rose-500" /> Spouse / Partner
                      </span>
                      <Badge variant={spouseMember ? "default" : "outline"} className="text-[10px]">
                        {spouseMember ? spouseMember.role : "1 Spot Available"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-1">
                    {spouseMember ? (
                      (() => {
                        const person = availablePeople.find((p) => p.id === spouseMember.clientId);
                        const isTrustee = (spouseMember.tags || []).includes("Trustee");

                        return (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <PersonAvatar
                                  photoUrl={person?.photoUrl}
                                  firstName={person?.firstName}
                                  lastName={person?.lastName}
                                  size="default"
                                />
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-sm">
                                    {formatPersonName(person, "Selected Person")}
                                  </p>
                                  <p className="truncate text-muted-foreground text-xs">
                                    {person?.emails?.find((e) => e.isPrimary)?.address ||
                                      person?.emails?.[0]?.address ||
                                      "No email"}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                type="button"
                                onClick={() => remove(spouseIndex)}
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive text-xs"
                              >
                                Clear
                              </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1 border-t">
                              <FormField
                                control={form.control}
                                name={`members.${spouseIndex}.role`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">Role</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger className="h-8 text-xs">
                                          <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="SPOUSE">Spouse</SelectItem>
                                        <SelectItem value="PARTNER">Partner</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormItem>
                                )}
                              />

                              <div className="flex items-end pb-1">
                                <Button
                                  type="button"
                                  variant={isTrustee ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => toggleTrusteeTag(spouseIndex)}
                                  className="h-8 w-full text-xs gap-1"
                                >
                                  <ShieldCheck className="h-3.5 w-3.5" />
                                  {isTrustee ? "Trustee" : "+ Trustee Tag"}
                                </Button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                              <FormField
                                control={form.control}
                                name={`members.${spouseIndex}.isPrimaryHousehold`}
                                render={({ field }) => (
                                  <FormItem className="flex items-center justify-between rounded-md border bg-background p-2">
                                    <FormLabel className="font-normal text-[11px]">Primary Household</FormLabel>
                                    <FormControl>
                                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`members.${spouseIndex}.includeInFinancialRollup`}
                                render={({ field }) => (
                                  <FormItem className="flex items-center justify-between rounded-md border bg-background p-2">
                                    <FormLabel className="font-normal text-[11px]">Financial Rollup</FormLabel>
                                    <FormControl>
                                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="space-y-3 py-3 text-center">
                        <p className="text-muted-foreground text-xs">
                          No Spouse or Partner selected. Click below to pick a person for this role.
                        </p>
                        <PersonSearchSelect
                          people={availablePeople.filter((p) => !fields.some((m) => m.clientId === p.id))}
                          onValueChange={(val) => handleAssignSpouse(val, "SPOUSE")}
                          onPersonCreated={(newPerson) => {
                            setAvailablePeople((prev) => [...prev, newPerson]);
                            handleAssignSpouse(newPerson.id!, "SPOUSE");
                          }}
                          placeholder="Select Spouse / Partner..."
                          value=""
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Other Household Members (Descendants & Collateral Family) */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <h3 className="font-medium text-sm">Other Household & Family Members</h3>
                  <p className="text-muted-foreground text-xs">
                    Add children, grandchildren, siblings, or other extended family members and specify relationships.
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {fields.filter((_, idx) => idx !== headIndex && idx !== spouseIndex).length} Additional Member(s)
                </Badge>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => {
                  if (index === headIndex || index === spouseIndex) return null;

                  const person = availablePeople.find((p) => p.id === field.clientId);
                  const currentRole = form.watch(`members.${index}.role`);
                  const isDescendant = isDescendantRole(currentRole);
                  const tags = form.watch(`members.${index}.tags`) || [];
                  const isTrustee = tags.includes("Trustee");

                  return (
                    <div
                      key={field.id}
                      className="flex flex-col items-start justify-between gap-4 rounded-lg border bg-muted/10 p-4 shadow-2xs"
                    >
                      <div className="flex w-full items-center justify-between border-b pb-3">
                        <div className="flex items-center gap-3">
                          <PersonAvatar
                            photoUrl={person?.photoUrl}
                            firstName={person?.firstName}
                            lastName={person?.lastName}
                            size="default"
                          />
                          <div>
                            <p className="font-semibold text-sm">{formatPersonName(person, "Unknown Person")}</p>
                            <p className="text-muted-foreground text-xs">
                              {person?.emails?.find((e) => e.isPrimary)?.address ||
                                person?.emails?.[0]?.address ||
                                "No Email"}
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

                      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
                        {/* Household Role */}
                        <FormField
                          control={form.control}
                          name={`members.${index}.role`}
                          render={({ field: roleField }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Household Role</FormLabel>
                              <Select
                                onValueChange={(val) => {
                                  roleField.onChange(val);
                                  // Default parentage/relatedTo when role changes
                                  if (isDescendantRole(val)) {
                                    form.setValue(`members.${index}.parentage`, "BOTH");
                                  } else {
                                    form.setValue(`members.${index}.relatedTo`, "HEAD");
                                  }
                                }}
                                defaultValue={roleField.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder="Select role" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectGroup>
                                    <SelectLabel className="text-[11px] font-semibold text-muted-foreground uppercase">
                                      Direct Descendants
                                    </SelectLabel>
                                    <SelectItem value="SON">Son</SelectItem>
                                    <SelectItem value="DAUGHTER">Daughter</SelectItem>
                                    <SelectItem value="GRANDSON">Grandson</SelectItem>
                                    <SelectItem value="GRANDDAUGHTER">Granddaughter</SelectItem>
                                    <SelectItem value="GREAT_GRANDSON">Great Grandson</SelectItem>
                                    <SelectItem value="GREAT_GRANDDAUGHTER">Great Granddaughter</SelectItem>
                                    <SelectItem value="DEPENDENT">Dependent (General)</SelectItem>
                                  </SelectGroup>
                                  <SelectGroup>
                                    <SelectLabel className="text-[11px] font-semibold text-muted-foreground uppercase">
                                      Collateral & Extended Family
                                    </SelectLabel>
                                    <SelectItem value="COUSIN">Cousin</SelectItem>
                                    <SelectItem value="UNCLE">Uncle</SelectItem>
                                    <SelectItem value="AUNT">Aunt</SelectItem>
                                    <SelectItem value="NEPHEW">Nephew</SelectItem>
                                    <SelectItem value="NIECE">Niece</SelectItem>
                                    <SelectItem value="BROTHER">Brother</SelectItem>
                                    <SelectItem value="SISTER">Sister</SelectItem>
                                    <SelectItem value="FATHER">Father</SelectItem>
                                    <SelectItem value="MOTHER">Mother</SelectItem>
                                    <SelectItem value="GRANDFATHER">Grandfather</SelectItem>
                                    <SelectItem value="GRANDMOTHER">Grandmother</SelectItem>
                                    <SelectItem value="IN_LAW">In-Law</SelectItem>
                                    <SelectItem value="OTHER">Other Relative</SelectItem>
                                    <SelectItem value="MEMBER">Member</SelectItem>
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Specific Relationship Context (Parentage vs Relation to) */}
                        {isDescendant ? (
                          <FormField
                            control={form.control}
                            name={`members.${index}.parentage`}
                            render={({ field: parentageField }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Child Of (Parentage)</FormLabel>
                                <Select
                                  onValueChange={parentageField.onChange}
                                  defaultValue={parentageField.value || "BOTH"}
                                >
                                  <FormControl>
                                    <SelectTrigger className="h-9 text-xs">
                                      <SelectValue placeholder="Select parents" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="BOTH">Head of Household & Spouse / Partner (Joint)</SelectItem>
                                    <SelectItem value="HEAD">
                                      Head of Household (Head's Child / Step to Spouse)
                                    </SelectItem>
                                    <SelectItem value="SPOUSE">
                                      Spouse / Partner (Spouse's Child / Step to Head)
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ) : (
                          <FormField
                            control={form.control}
                            name={`members.${index}.relatedTo`}
                            render={({ field: relatedToField }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Relation Target</FormLabel>
                                <Select
                                  onValueChange={relatedToField.onChange}
                                  defaultValue={relatedToField.value || "HEAD"}
                                >
                                  <FormControl>
                                    <SelectTrigger className="h-9 text-xs">
                                      <SelectValue placeholder="Select target" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="HEAD">Related to Head of Household</SelectItem>
                                    <SelectItem value="SPOUSE">Related to Spouse / Partner</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {/* Rollup & Primary Controls */}
                        <div className="flex flex-col gap-2">
                          <FormField
                            control={form.control}
                            name={`members.${index}.isPrimaryHousehold`}
                            render={({ field: swField }) => (
                              <FormItem className="flex items-center justify-between rounded-md border bg-background p-1.5">
                                <FormLabel className="font-normal text-xs">Primary Household</FormLabel>
                                <FormControl>
                                  <Switch checked={swField.value} onCheckedChange={swField.onChange} />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`members.${index}.includeInFinancialRollup`}
                            render={({ field: swField }) => (
                              <FormItem className="flex items-center justify-between rounded-md border bg-background p-1.5">
                                <FormLabel className="font-normal text-xs">Financial Rollup</FormLabel>
                                <FormControl>
                                  <Switch checked={swField.value} onCheckedChange={swField.onChange} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Tagging Section (Trustee & Custom Tags) */}
                      <div className="w-full space-y-2 border-t pt-3">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 font-medium text-xs text-muted-foreground">
                            <Tag className="h-3.5 w-3.5" /> Person Tags & Roles
                          </span>
                          <Button
                            type="button"
                            variant={isTrustee ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleTrusteeTag(index)}
                            className="h-7 text-xs gap-1"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            {isTrustee ? "Trustee Tagged" : "+ Trustee Tag"}
                          </Button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="gap-1 text-xs py-0.5">
                              {tag}
                              <button
                                type="button"
                                onClick={() => handleRemoveTag(index, tag)}
                                className="ml-1 rounded-full text-muted-foreground hover:text-foreground"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                          <div className="flex items-center gap-1">
                            <Input
                              placeholder="Add tag..."
                              value={newCustomTagMap[index] || ""}
                              onChange={(e) => setNewCustomTagMap((prev) => ({ ...prev, [index]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddCustomTag(index);
                                }
                              }}
                              className="h-7 w-28 text-xs"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAddCustomTag(index)}
                              className="h-7 px-2 text-xs"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {fields.length === 0 && (
                  <div className="rounded-md border border-dashed bg-muted/5 py-6 text-center">
                    <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground opacity-20" />
                    <p className="text-muted-foreground text-sm">No household members added yet.</p>
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  <FormLabel>Add Additional Member</FormLabel>
                  <PersonSearchSelect
                    people={availablePeople.filter(
                      (p) => !(form.getValues("members") || []).some((m) => m.clientId === p.id),
                    )}
                    onValueChange={(val) => handleAddOtherMember(val)}
                    onPersonCreated={(newPerson) => {
                      setAvailablePeople((prev) => [...prev, newPerson]);
                      handleAddOtherMember(newPerson.id!);
                    }}
                    placeholder="Search people by name..."
                    value=""
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
