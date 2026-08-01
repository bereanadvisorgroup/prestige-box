"use client";

import { useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Check, Eye, EyeOff, MapPin, Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

import { createAddress, getAddresses } from "@/actions/addresses";
import { createPerson, updatePerson } from "@/actions/people";
import { AddressAutocomplete } from "@/components/features/crm/address-autocomplete";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SsnInput } from "@/components/ui/ssn-input";
import { getSocialAvatarUrl } from "@/lib/social";
import { supabase } from "@/lib/supabase.client";
import { getInitials } from "@/lib/utils";
import { type Address, type Person, type PersonFormInput, PersonFormSchema, type PersonFormValues } from "@/types/crm";

interface PersonFormProps {
  person?: Person;
  onSuccess?: (personId: string) => void;
}

export function PersonForm({ person, onSuccess }: PersonFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [availableAddresses, setAvailableAddresses] = useState<Address[]>([]);
  const [addressSearchQuery, setAddressSearchQuery] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);

      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Please select a valid image (JPEG, PNG, GIF, or WebP).");
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size must be under 2MB.");
        return;
      }

      const fileExt = file.name.split(".").pop();
      const folderId = person?.id || crypto.randomUUID();
      const filePath = `people/${folderId}/${Date.now()}-photo.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      form.setValue("photoUrl", publicUrl, { shouldDirty: true });
      toast.success("Photo uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload profile photo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    const currentPhotoUrl = form.getValues("photoUrl");
    if (currentPhotoUrl?.includes("/avatars/") && currentPhotoUrl.includes("people/")) {
      try {
        const oldPath = currentPhotoUrl.split("/public/avatars/")[1];
        if (oldPath) {
          await supabase.storage.from("avatars").remove([oldPath]);
        }
      } catch (removeErr) {
        console.warn("Could not delete custom photo from storage:", removeErr);
      }
    }
    form.setValue("photoUrl", null, { shouldDirty: true });
    toast.success("Photo removed!");
  };

  const defaultEmails = person?.emails?.length
    ? person.emails
    : [{ id: crypto.randomUUID(), address: "", type: "Personal" as const, isPrimary: true }];

  const defaultPhones = person?.phones?.length
    ? person.phones
    : [{ id: crypto.randomUUID(), number: "", type: "Mobile" as const, isPrimary: true }];

  const defaultSocialMedia = person?.socialMedia?.length ? person.socialMedia : [];

  const defaultAddresses = person?.addresses?.length
    ? person.addresses
    : person?.addressIds?.length
      ? person.addressIds.map((id, index) => ({ id, type: "Home" as const, isPrimary: index === 0 }))
      : [];

  const sanitizePerson = (p?: Person): Person | undefined => {
    if (!p) return undefined;
    return {
      ...p,
      prefix: p.prefix ?? "",
      middleName: p.middleName ?? "",
      lastName: p.lastName ?? "",
      suffix: p.suffix ?? "",
      photoUrl: p.photoUrl ?? "",
      emails: p.emails || defaultEmails,
      phones: p.phones || defaultPhones,
      socialMedia: p.socialMedia || defaultSocialMedia,
      addresses: p.addresses || defaultAddresses,
      addressIds: p.addressIds || defaultAddresses.map((a) => a.id),
    };
  };

  const form = useForm<PersonFormInput, any, PersonFormValues>({
    resolver: zodResolver(PersonFormSchema),
    mode: "onChange",
    defaultValues: sanitizePerson(person) || {
      prefix: "",
      firstName: "",
      middleName: "",
      lastName: "",
      suffix: "",
      photoUrl: "",
      emails: defaultEmails,
      phones: defaultPhones,
      socialMedia: defaultSocialMedia,
      addresses: defaultAddresses,
      addressIds: defaultAddresses.map((a) => a.id),
    },
  });

  const {
    fields: emailFields,
    append: appendEmail,
    remove: removeEmail,
  } = useFieldArray({
    control: form.control,
    name: "emails",
  });

  const {
    fields: phoneFields,
    append: appendPhone,
    remove: removePhone,
  } = useFieldArray({
    control: form.control,
    name: "phones",
  });

  const {
    fields: socialMediaFields,
    append: appendSocialMedia,
    remove: removeSocialMedia,
  } = useFieldArray({
    control: form.control,
    name: "socialMedia",
  });

  const {
    fields: addressFields,
    append: appendAddress,
    remove: removeAddress,
  } = useFieldArray({
    control: form.control,
    name: "addresses",
  });

  useEffect(() => {
    async function fetchAddresses() {
      const result = await getAddresses();
      if (result.success && result.addresses) {
        setAvailableAddresses(result.addresses);
      }
    }
    fetchAddresses();
  }, []);

  const handleAddressSelect = async (addressData: Omit<Address, "id" | "createdAt">) => {
    let addressId: string | undefined;
    const existing = availableAddresses.find(
      (a) =>
        a.street1.toLowerCase() === addressData.street1.toLowerCase() &&
        a.city.toLowerCase() === addressData.city.toLowerCase() &&
        a.state.toLowerCase() === addressData.state.toLowerCase() &&
        a.zipCode.toLowerCase() === addressData.zipCode.toLowerCase(),
    );

    if (existing?.id) {
      addressId = existing.id;
    } else {
      const result = await createAddress(addressData);
      if (result.success && result.id) {
        addressId = result.id;
        const newAddress = { ...addressData, id: result.id };
        setAvailableAddresses((prev) => [...prev, newAddress]);
      } else {
        toast.error("Failed to create new address");
        return;
      }
    }

    if (!(form.getValues("addresses") || []).some((a) => a.id === addressId)) {
      const isFirst = (form.getValues("addresses") || []).length === 0;
      appendAddress({
        id: addressId!,
        type: "Home",
        isPrimary: isFirst,
      });
    }
    setAddressSearchQuery("");
  };

  async function onSubmit(values: PersonFormValues) {
    try {
      setIsLoading(true);
      const submission = { ...values };
      // Ensure addressIds syncs with addresses array
      submission.addressIds = submission.addresses?.map((a) => a.id) || [];

      const isEditing = !!person?.id;

      const result = isEditing ? await updatePerson(person.id!, submission) : await createPerson(submission);

      if (result.success) {
        toast.success(isEditing ? "Person updated successfully" : "Person created successfully");
        if (onSuccess) {
          onSuccess(isEditing ? person.id! : (result as unknown as { id: string }).id);
        } else {
          router.push("/dashboard/crm/people");
        }
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
    <Card className="mx-auto w-full max-w-4xl shadow-sm">
      <CardHeader>
        <CardTitle>{person ? "Edit Person" : "Add New Person"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4">
              <h3 className="border-b pb-2 font-medium text-sm">Personal Information</h3>

              {/* Photo Upload Section */}
              <div className="flex flex-col items-center gap-6 border-muted/50 border-b pb-6 sm:flex-row">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative flex h-24 w-24 cursor-pointer items-center justify-center rounded-full border-2 border-muted-foreground/30 border-dashed transition-all duration-300 hover:border-primary/50 hover:bg-accent/40"
                  aria-label="Upload profile photo"
                >
                  {(() => {
                    const currentPhotoUrl = form.watch("photoUrl");
                    const socialMediaList = form.watch("socialMedia") || [];
                    const activeSocial = socialMediaList.find((sm) => sm.useProfilePhoto);
                    const previewPhotoUrl = activeSocial
                      ? getSocialAvatarUrl(activeSocial.type, activeSocial.url) || currentPhotoUrl
                      : currentPhotoUrl;
                    return (
                      <Avatar className="h-[88px] w-[88px]">
                        <AvatarImage
                          src={previewPhotoUrl || undefined}
                          alt="Profile Preview"
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-primary/5 font-bold text-lg text-primary">
                          {getInitials(`${form.watch("firstName")} ${form.watch("lastName")}`)}
                        </AvatarFallback>
                      </Avatar>
                    );
                  })()}

                  <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <Camera className="h-5 w-5 text-white" />
                    <span className="mt-1 font-medium text-[9px] text-white">Upload Photo</span>
                  </div>

                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/80">
                      <span className="h-5 w-5 animate-spin rounded-full border-primary border-b-2" />
                    </div>
                  )}
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) await handleFileUpload(file);
                  }}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex flex-col gap-1.5 text-center sm:text-left">
                  <h4 className="font-semibold text-sm">Profile Picture</h4>
                  <p className="text-muted-foreground text-xs">
                    Click the avatar to upload a photo (JPEG, PNG, up to 2MB).
                  </p>
                  {form.watch("photoUrl") && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemovePhoto}
                      className="mt-1 h-7 w-fit gap-1.5 border-red-200 text-red-600 transition-all duration-300 hover:bg-red-50 hover:text-red-600 dark:border-red-950 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="h-3 w-3" />
                      Remove Photo
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                <FormField
                  control={form.control}
                  name="prefix"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>Prefix</FormLabel>
                      <FormControl>
                        <Input list="prefixes" placeholder="Mr." {...field} />
                      </FormControl>
                      <datalist id="prefixes">
                        <option value="Mr." />
                        <option value="Mrs." />
                        <option value="Ms." />
                        <option value="Dr." />
                        <option value="Prof." />
                      </datalist>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
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
                    <FormItem className="md:col-span-1">
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
                    <FormItem className="md:col-span-1">
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="suffix"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>Suffix</FormLabel>
                      <FormControl>
                        <Input list="suffixes" placeholder="Jr." {...field} />
                      </FormControl>
                      <datalist id="suffixes">
                        <option value="Jr." />
                        <option value="Sr." />
                        <option value="II" />
                        <option value="III" />
                        <option value="PhD" />
                      </datalist>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Emails Section */}
              <div className="space-y-3 pt-4">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-base">Email Addresses</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      appendEmail({ id: crypto.randomUUID(), address: "", type: "Personal", isPrimary: false })
                    }
                  >
                    <Plus className="mr-1 h-4 w-4" /> Add Email
                  </Button>
                </div>
                {emailFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex flex-col items-end gap-3 rounded-md border bg-muted/20 p-3 sm:flex-row"
                  >
                    <FormField
                      control={form.control}
                      name={`emails.${index}.address`}
                      render={({ field: inputField, fieldState }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="text-xs">Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                placeholder="email@example.com"
                                type="email"
                                {...inputField}
                                className={fieldState.isDirty && !fieldState.invalid && inputField.value ? "pr-10" : ""}
                              />
                              {fieldState.isDirty && !fieldState.invalid && inputField.value && (
                                <Check className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-green-500" />
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`emails.${index}.type`}
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
                              <SelectItem value="Personal">Personal</SelectItem>
                              <SelectItem value="Work">Work</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`emails.${index}.isPrimary`}
                      render={({ field: checkField }) => (
                        <FormItem className="flex flex-col items-center justify-end px-2 pb-2">
                          <FormLabel className="mb-2 text-xs">Primary</FormLabel>
                          <FormControl>
                            <input
                              type="radio"
                              name="primaryEmail"
                              checked={checkField.value}
                              onChange={() => {
                                // Set all to false, then this to true
                                const currentEmails = form.getValues("emails") || [];
                                currentEmails.forEach((_, i) => {
                                  form.setValue(`emails.${i}.isPrimary`, false);
                                });
                                form.setValue(`emails.${index}.isPrimary`, true);
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
                      onClick={() => removeEmail(index)}
                      className="text-destructive hover:bg-destructive/10"
                      disabled={emailFields.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Phones Section */}
              <div className="space-y-3 pt-4">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-base">Phone Numbers</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      appendPhone({ id: crypto.randomUUID(), number: "", type: "Mobile", isPrimary: false })
                    }
                  >
                    <Plus className="mr-1 h-4 w-4" /> Add Phone
                  </Button>
                </div>
                {phoneFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex flex-col items-end gap-3 rounded-md border bg-muted/20 p-3 sm:flex-row"
                  >
                    <FormField
                      control={form.control}
                      name={`phones.${index}.number`}
                      render={({ field: inputField }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="text-xs">Number</FormLabel>
                          <FormControl>
                            <PhoneInput placeholder="555-000-0000" {...inputField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`phones.${index}.type`}
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
                              <SelectItem value="Work">Work</SelectItem>
                              <SelectItem value="Home">Home</SelectItem>
                              <SelectItem value="Mobile">Mobile</SelectItem>
                              <SelectItem value="Vacation">Vacation</SelectItem>
                              <SelectItem value="Fax">Fax</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`phones.${index}.isPrimary`}
                      render={({ field: checkField }) => (
                        <FormItem className="flex flex-col items-center justify-end px-2 pb-2">
                          <FormLabel className="mb-2 text-xs">Primary</FormLabel>
                          <FormControl>
                            <input
                              type="radio"
                              name="primaryPhone"
                              checked={checkField.value}
                              onChange={() => {
                                const currentPhones = form.getValues("phones") || [];
                                currentPhones.forEach((_, i) => {
                                  form.setValue(`phones.${i}.isPrimary`, false);
                                });
                                form.setValue(`phones.${index}.isPrimary`, true);
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
                      onClick={() => removePhone(index)}
                      className="text-destructive hover:bg-destructive/10"
                      disabled={phoneFields.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Social Media Section */}
              <div className="space-y-3 pt-4">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-base">Social Media Accounts</FormLabel>
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
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="border-b pb-2 font-medium text-sm">Addresses</h3>

              <div className="mb-4 space-y-2">
                <FormLabel>Search & Add Address</FormLabel>
                <AddressAutocomplete
                  value={addressSearchQuery}
                  onValueChange={setAddressSearchQuery}
                  onAddressSelect={handleAddressSelect}
                  placeholder="Start typing an address using Google Places..."
                />
              </div>

              {addressFields.length > 0 && (
                <div className="space-y-3">
                  {addressFields.map((field, index) => {
                    const addressId = (form.watch("addresses") || [])[index]?.id;
                    const addrDetails = availableAddresses.find((a) => a.id === addressId);
                    return (
                      <div
                        key={field.id}
                        className="flex flex-col items-end gap-3 rounded-md border bg-muted/20 p-3 sm:flex-row"
                      >
                        <div className="flex-1">
                          <FormLabel className="mb-2 block text-muted-foreground text-xs">Address details</FormLabel>
                          {addrDetails ? (
                            <div className="flex h-10 items-start gap-2 py-2">
                              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                              <div className="text-sm">
                                <span className="mr-1 font-medium">
                                  {addrDetails.street1}
                                  {addrDetails.street2 ? `, ${addrDetails.street2}` : ""}
                                </span>
                                <span className="text-muted-foreground">
                                  {addrDetails.city}, {addrDetails.state} {addrDetails.zipCode}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex h-10 items-center py-2 text-muted-foreground text-sm">
                              Loading details...
                            </div>
                          )}
                        </div>

                        <FormField
                          control={form.control}
                          name={`addresses.${index}.type`}
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
                                  <SelectItem value="Home">Home</SelectItem>
                                  <SelectItem value="Business">Business</SelectItem>
                                  <SelectItem value="Vacation">Vacation</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`addresses.${index}.isPrimary`}
                          render={({ field: checkField }) => (
                            <FormItem className="flex flex-col items-center justify-end px-2 pb-2">
                              <FormLabel className="mb-2 text-xs">Primary</FormLabel>
                              <FormControl>
                                <input
                                  type="radio"
                                  name="primaryAddress"
                                  checked={checkField.value}
                                  onChange={() => {
                                    const currentAddresses = form.getValues("addresses") || [];
                                    currentAddresses.forEach((_, i) => {
                                      form.setValue(`addresses.${i}.isPrimary`, false);
                                    });
                                    form.setValue(`addresses.${index}.isPrimary`, true);
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
                          onClick={() => removeAddress(index)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t pt-6">
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
