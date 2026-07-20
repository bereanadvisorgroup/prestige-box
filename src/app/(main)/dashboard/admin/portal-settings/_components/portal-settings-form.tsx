"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building, Globe, Loader2, Mail, Phone, Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { updatePortalSettings } from "@/actions/settings";
import { LogoUpload } from "@/components/crm/logo-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSocialAvatarUrl } from "@/lib/social";

const SettingsSchema = z.object({
  companyName: z.string().min(2, { message: "Company name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid business email address." }),
  phone: z.string().min(5, { message: "Please enter a valid phone number." }),
  website: z
    .string()
    .trim()
    .refine((val) => val === "" || /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(val), {
      message: "Please enter a valid website URL.",
    }),
  logoUrl: z.string().nullable().optional(),
  socialMedia: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      url: z.string().url({ message: "Please enter a valid URL." }).or(z.literal("")),
      isPrimary: z.boolean(),
      useProfilePhoto: z.boolean(),
    }),
  ),
});

interface PortalSettingsFormProps {
  initialEmail: string;
  initialPhone: string;
  initialWebsite: string;
  initialLogoUrl: string;
  initialCompanyName: string;
  initialSocialMediaRaw: string;
}

export function PortalSettingsForm({
  initialEmail,
  initialPhone,
  initialWebsite,
  initialLogoUrl,
  initialCompanyName,
  initialSocialMediaRaw,
}: PortalSettingsFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  let parsedSocialMedia = [];
  try {
    parsedSocialMedia = JSON.parse(initialSocialMediaRaw || "[]");
  } catch (e) {
    console.error("Failed to parse initial social media:", e);
  }

  const form = useForm<z.infer<typeof SettingsSchema>>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      companyName: initialCompanyName,
      email: initialEmail,
      phone: initialPhone,
      website: initialWebsite,
      logoUrl: initialLogoUrl || null,
      socialMedia: parsedSocialMedia,
    },
  });

  const {
    fields: socialMediaFields,
    append: appendSocialMedia,
    remove: removeSocialMedia,
  } = useFieldArray({
    control: form.control,
    name: "socialMedia",
  });

  // Dynamic logo preview logic
  const socialMedia = form.watch("socialMedia") || [];
  const useSocialPhoto = socialMedia.find((sm) => sm.useProfilePhoto);
  const socialAvatarUrl = useSocialPhoto ? getSocialAvatarUrl(useSocialPhoto.type, useSocialPhoto.url) : null;
  const activeLogoUrl = socialAvatarUrl || form.watch("logoUrl");

  const onSubmit = async (values: z.infer<typeof SettingsSchema>) => {
    try {
      setIsSaving(true);
      // Clean up website URL prefix if needed
      let formattedWebsite = values.website;
      if (formattedWebsite && !formattedWebsite.startsWith("http://") && !formattedWebsite.startsWith("https://")) {
        formattedWebsite = `https://${formattedWebsite}`;
      }

      const socialMediaRaw = JSON.stringify(values.socialMedia || []);

      const res = await updatePortalSettings(
        values.email,
        values.phone,
        formattedWebsite,
        values.logoUrl || "",
        values.companyName,
        socialMediaRaw,
      );

      if (!res.success) {
        throw new Error(res.error || "Failed to update portal settings.");
      }

      toast.success("Portal settings updated successfully.");
      router.push("/dashboard/admin");
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message || "An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="border">
          <CardHeader>
            <CardTitle className="font-bold text-xl">General Branding & Logo</CardTitle>
            <CardDescription>
              Upload a logo or check the "Use Photo" option on a social account to fetch a profile picture.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <LogoUpload
                      value={activeLogoUrl}
                      onChange={(newUrl) => {
                        field.onChange(newUrl);
                        if (newUrl) {
                          // Automatically turn off useProfilePhoto to fallback to the uploaded file
                          const currentSM = form.getValues("socialMedia") || [];
                          currentSM.forEach((_, i) => {
                            form.setValue(`socialMedia.${i}.useProfilePhoto`, false);
                          });
                        }
                      }}
                      entityType="branding"
                      entityId="portal"
                      name={form.watch("companyName")}
                    />
                  </FormControl>
                  {useSocialPhoto && (
                    <FormDescription className="text-amber-600 text-xs dark:text-amber-500">
                      Currently using your {useSocialPhoto.type} profile photo as the active portal logo. Uploading a
                      custom logo will turn this off.
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Building className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Prestige Advisors" className="pl-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader>
            <CardTitle className="font-bold text-xl">Contact Information</CardTitle>
            <CardDescription>
              Configure contact details and web links displayed across public pages and headers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Support Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="support@company.com" className="pl-10" {...field} />
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
                <FormItem>
                  <FormLabel>Support Phone Number</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="941-799-3300" className="pl-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Website</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Globe className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="https://www.company.com" className="pl-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between pb-4 space-y-0">
            <div className="space-y-1.5 pr-4">
              <CardTitle className="font-bold text-xl">Social Media Accounts</CardTitle>
              <CardDescription>
                Configure links to corporate social profiles and specify a primary platform.
              </CardDescription>
            </div>
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
              <Plus className="mr-1 h-4 w-4" /> Add Link
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 border-t border-muted/40 pt-4">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/admin")} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" className="font-semibold" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
