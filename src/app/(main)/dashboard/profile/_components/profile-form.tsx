"use client";

import { useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Trash2, UploadCloud } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/lib/supabase.client";
import { getInitials } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";

const formSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
});

export function ProfileForm() {
  const router = useRouter();
  const { user, profile, setProfile, isLoading } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [photoURL, setPhotoURL] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
    },
  });

  // Load profile values into the form when profile is fetched
  useEffect(() => {
    if (profile) {
      form.reset({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
      });
      setPhotoURL(profile.photoURL || "");
    }
  }, [profile, form]);

  if (isLoading || !profile || !user) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
    );
  }

  // Check if a social (Google) login photo exists and is different from the current photoURL
  const googlePhotoURL = user?.user_metadata?.avatar_url || "";
  const hasGooglePhoto = !!googlePhotoURL;
  const isUsingGooglePhoto = photoURL === googlePhotoURL;

  // Handle file uploads to Supabase Storage
  const handleFileUpload = async (file: File) => {
    if (!user) return;
    try {
      setIsUploading(true);

      // 1. Validation
      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Please select a valid image (JPEG, PNG, GIF, or WebP).");
        return;
      }

      // Max size: 2MB
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size must be under 2MB.");
        return;
      }

      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}-avatar.${fileExt}`;

      // 2. Upload to storage
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 3. Get Public URL
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      // 4. Remove old custom photo if it was in the avatars storage
      if (photoURL?.includes("/avatars/") && photoURL.includes(user.id)) {
        try {
          const oldPath = photoURL.split("/public/avatars/")[1];
          if (oldPath) {
            await supabase.storage.from("avatars").remove([oldPath]);
          }
        } catch (removeErr) {
          console.warn("Could not clean up old custom avatar file:", removeErr);
        }
      }

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

  // Drag and drop handlers
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

  // Use google/social login photo
  const handleUseGooglePhoto = () => {
    setPhotoURL(googlePhotoURL);
    toast.success("Switched to social login photo! Save changes to persist.");
  };

  // Remove photo
  const handleRemovePhoto = async () => {
    if (!user) return;
    // If it's a custom uploaded photo, remove it from storage immediately to keep bucket clean
    if (photoURL?.includes("/avatars/") && photoURL.includes(user.id)) {
      try {
        const oldPath = photoURL.split("/public/avatars/")[1];
        if (oldPath) {
          await supabase.storage.from("avatars").remove([oldPath]);
        }
      } catch (removeErr) {
        console.warn("Could not delete custom avatar from storage:", removeErr);
      }
    }
    setPhotoURL("");
    toast.success("Photo removed! Save changes to persist.");
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!profile || !user) return;
    try {
      setIsSaving(true);

      // 1. Update public.users database record
      const { error: dbError } = await supabase
        .from("users")
        .update({
          firstName: values.firstName,
          lastName: values.lastName,
          photoURL: photoURL || null,
          updatedAt: new Date().toISOString(),
        })
        .eq("uid", user.id);

      if (dbError) throw dbError;

      // 2. Update user metadata in Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          firstName: values.firstName,
          lastName: values.lastName,
        },
      });

      if (authError) throw authError;

      // 3. Update client-side global store
      setProfile({
        ...profile,
        firstName: values.firstName,
        lastName: values.lastName,
        photoURL: photoURL || "",
      });

      toast.success("Profile updated successfully!");
      router.refresh();
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error((error as { message: string }).message || "Failed to save profile changes.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Photo Upload Section */}
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <button
            type="button"
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group relative flex h-28 w-28 cursor-pointer items-center justify-center rounded-full border-2 border-dashed transition-all duration-300 ${
              isDragging
                ? "scale-105 border-primary bg-primary/10 shadow-lg"
                : "border-muted-foreground/30 hover:border-primary/50 hover:bg-accent/40"
            }`}
            aria-label="Upload profile photo"
          >
            <Avatar className="h-[104px] w-[104px]">
              <AvatarImage
                src={photoURL || undefined}
                alt={`${profile.firstName} ${profile.lastName}`}
                className="object-cover"
              />
              <AvatarFallback className="bg-primary/5 font-bold text-primary text-xl">
                {getInitials(`${profile.firstName} ${profile.lastName}`)}
              </AvatarFallback>
            </Avatar>

            {/* Hover overlay with Upload icon */}
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <Camera className="h-6 w-6 text-white" />
              <span className="mt-1 font-medium text-[10px] text-white">Upload Photo</span>
            </div>

            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/80">
                <Spinner className="h-8 w-8 text-primary" />
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
            <h2 className="font-semibold text-lg">Profile Picture</h2>
            <p className="text-muted-foreground text-sm">
              Click the avatar to upload an image, or drag and drop a file (up to 2MB).
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {hasGooglePhoto && !isUsingGooglePhoto && (
                <Button
                  id="use-social-photo-btn"
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleUseGooglePhoto}
                  className="h-8 gap-2 border-primary/20 transition-all duration-300 hover:bg-primary/5 hover:text-primary"
                >
                  <UploadCloud className="h-3.5 w-3.5" />
                  Use Google Photo
                </Button>
              )}
              {photoURL && (
                <Button
                  id="remove-photo-btn"
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemovePhoto}
                  className="h-8 gap-2 border-red-200 text-red-600 transition-all duration-300 hover:bg-red-50 hover:text-red-600 dark:border-red-950 dark:hover:bg-red-950/40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove Photo
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Input Fields Section */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input id="first-name-input" placeholder="First name" {...field} />
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
                  <Input id="last-name-input" placeholder="Last name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Disabled Account Metadata */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <FormLabel>Email Address</FormLabel>
            <Input value={profile.email || ""} disabled className="bg-muted text-muted-foreground" />
            <p className="text-[11px] text-muted-foreground">Contact support to change your account email.</p>
          </div>
          <div className="space-y-2">
            <FormLabel>Account Role</FormLabel>
            <Input value={profile.role || ""} disabled className="bg-muted text-muted-foreground capitalize" />
            <p className="text-[11px] text-muted-foreground">Role privileges are managed by the administrator.</p>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex gap-4 pt-4">
          <Button id="save-profile-btn" type="submit" disabled={isSaving || isUploading} className="min-w-32">
            {isSaving ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const defaultPage =
                profile?.role === "admin" || profile?.role === "advisor" ? "/dashboard/crm" : "/dashboard/default";
              router.push(defaultPage);
            }}
            disabled={isSaving || isUploading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
