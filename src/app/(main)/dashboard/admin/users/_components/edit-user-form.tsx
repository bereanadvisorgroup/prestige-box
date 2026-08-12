"use client";

import { useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Check, Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { updateUser } from "@/actions/users";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { getSocialAvatarUrl, getUserPhotoUrl } from "@/lib/social";
import { supabase } from "@/lib/supabase.client";
import { getInitials } from "@/lib/utils";
import { type UserProfile, type UserRole, useAuthStore } from "@/stores/auth.store";
import { type SocialMediaAccount, SocialMediaAccountSchema } from "@/types/crm";

const formSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  role: z.string().min(1, "Please select a role."),
  socialMedia: z.array(SocialMediaAccountSchema).default([]),
});

type FormInput = z.input<typeof formSchema>;
type FormValues = z.output<typeof formSchema>;

interface EditUserFormProps {
  user: UserProfile;
}

export function EditUserForm({ user }: EditUserFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [photoURL, setPhotoURL] = useState<string>(user.photoURL || "");
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { profile: currentProfile, setProfile } = useAuthStore();

  const form = useForm<FormInput, any, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      role: user.role || "client",
      socialMedia: user.socialMedia || [],
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

  const watchedFirstName = form.watch("firstName");
  const watchedLastName = form.watch("lastName");
  const initials = getInitials(`${watchedFirstName} ${watchedLastName}`);

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
      const filePath = `${user.uid}/${Date.now()}-avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      // Clean up old custom photo if it was in avatars bucket
      if (photoURL?.includes("/avatars/") && photoURL.includes(user.uid)) {
        try {
          const oldPath = photoURL.split("/public/avatars/")[1];
          if (oldPath) {
            await supabase.storage.from("avatars").remove([oldPath]);
          }
        } catch (removeErr) {
          console.warn("Could not clean up old custom avatar file:", removeErr);
        }
      }

      // Reset social media photo flags
      const currentSM = form.getValues("socialMedia") || [];
      currentSM.forEach((_, i) => {
        form.setValue(`socialMedia.${i}.useProfilePhoto`, false);
      });

      setPhotoURL(publicUrl);
      toast.success("Photo uploaded successfully! Save changes to persist.");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload profile photo.");
    } finally {
      setIsUploading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleRemovePhoto = async () => {
    if (photoURL?.includes("/avatars/") && photoURL.includes(user.uid)) {
      try {
        const oldPath = photoURL.split("/public/avatars/")[1];
        if (oldPath) {
          await supabase.storage.from("avatars").remove([oldPath]);
        }
      } catch (removeErr) {
        console.warn("Could not delete custom avatar from storage:", removeErr);
      }
    }
    const currentSM = form.getValues("socialMedia") || [];
    currentSM.forEach((_, i) => {
      form.setValue(`socialMedia.${i}.useProfilePhoto`, false);
    });
    setPhotoURL("");
    toast.success("Photo removed! Save changes to persist.");
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);

      const activeSocial = values.socialMedia.find((sm) => sm.useProfilePhoto);
      let finalPhotoURL: string | null = photoURL || null;

      if (activeSocial) {
        const socialAvatar = getSocialAvatarUrl(activeSocial.type, activeSocial.url);
        if (socialAvatar) finalPhotoURL = socialAvatar;
      }

      const result = await updateUser(user.uid, {
        firstName: values.firstName,
        lastName: values.lastName,
        role: values.role as UserRole,
        photoURL: finalPhotoURL,
        socialMedia: values.socialMedia,
      });

      if (result.success) {
        if (currentProfile && currentProfile.uid === user.uid) {
          setProfile({
            ...currentProfile,
            firstName: values.firstName,
            lastName: values.lastName,
            role: values.role as UserRole,
            photoURL: finalPhotoURL || "",
            socialMedia: values.socialMedia,
            googlePhotoURL: user.googlePhotoURL,
          });
        }
        toast.success("User updated successfully");
        router.push("/dashboard/admin/users");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update user");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  const socialMediaList = form.watch("socialMedia") || [];
  const activeSocial = (socialMediaList as SocialMediaAccount[]).find((sm) => sm.useProfilePhoto);
  const previewPhotoUrl = getUserPhotoUrl({
    ...user,
    photoURL: photoURL || undefined,
    socialMedia: socialMediaList as SocialMediaAccount[],
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        {/* Photo Section */}
        <div className="flex flex-col items-center gap-6 border-b pb-6 sm:flex-row">
          <button
            type="button"
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group relative flex h-24 w-24 cursor-pointer items-center justify-center rounded-full border-2 border-dashed transition-all duration-300 ${
              isDragging
                ? "scale-105 border-primary bg-primary/10 shadow-lg"
                : "border-muted-foreground/30 hover:border-primary/50 hover:bg-accent/40"
            }`}
            aria-label="Upload profile photo"
          >
            <Avatar className="h-[88px] w-[88px]">
              <AvatarImage
                src={previewPhotoUrl || undefined}
                alt={`${watchedFirstName} ${watchedLastName}`}
                className="object-cover"
              />
              <AvatarFallback className="bg-primary/5 font-bold text-lg text-primary">{initials}</AvatarFallback>
            </Avatar>

            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <Camera className="h-5 w-5 text-white" />
              <span className="mt-1 font-medium text-[8px] text-white">Upload</span>
            </div>

            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/80">
                <Spinner className="h-6 w-6 text-primary" />
              </div>
            )}
          </button>

          <input
            id="avatar-upload-input"
            type="file"
            ref={fileInputRef}
            onChange={onFileChange}
            accept="image/*"
            className="hidden"
          />

          <div className="flex flex-col gap-2">
            <h2 className="font-semibold text-base">Profile Picture</h2>
            <p className="text-muted-foreground text-xs">
              Click avatar to upload or select a social media photo below.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {(photoURL || activeSocial) && (
                <Button
                  id="remove-photo-btn"
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemovePhoto}
                  className="h-7 gap-1.5 border-red-200 text-red-600 text-xs transition-all duration-300 hover:bg-red-50 hover:text-red-600 dark:border-red-950 dark:hover:bg-red-950/40"
                >
                  <Trash2 className="h-3 w-3" />
                  Remove Photo
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* User Info Fields */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
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
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-2">
          <FormLabel>Email</FormLabel>
          <Input value={user.email || ""} disabled className="bg-muted" />
          <p className="text-[0.8rem] text-muted-foreground">Email cannot be changed after creation.</p>
        </div>

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="advisor">Advisor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Social Media Section */}
        <div className="space-y-4 rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">Social Media Accounts</h3>
              <p className="text-muted-foreground text-xs">
                Add social profiles and choose if you want to use their profile picture.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendSocialMedia({
                  id: crypto.randomUUID(),
                  type: "LinkedIn",
                  url: "",
                  isPrimary: socialMediaFields.length === 0,
                  useProfilePhoto: false,
                })
              }
            >
              <Plus className="mr-1 h-3.5 w-3.5" /> Add Account
            </Button>
          </div>

          {socialMediaFields.length === 0 ? (
            <p className="py-2 text-center text-muted-foreground text-xs">No social media accounts added yet.</p>
          ) : (
            socialMediaFields.map((field, index) => (
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
                              const avatarUrl = getSocialAvatarUrl(currentSM[index].type, currentSM[index].url);
                              if (avatarUrl) {
                                setPhotoURL(avatarUrl);
                              }
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
            ))
          )}
        </div>

        <div className="flex flex-col gap-4 pt-4 md:flex-row">
          <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/admin/users")}
            className="w-full md:w-auto"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
